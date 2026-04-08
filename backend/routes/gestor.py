from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import hash_password
from core.dependencies import require_gestor
from models.usuario import Colaborador, HistoricoSenha, Gestor
from models.log import LogAtividade
from schemas.usuario import (
    ColaboradorCreate, ColaboradorUpdate, ColaboradorResponse,
    RedefinirSenhaRequest, GestorUpdate, GestorResponse, HistoricoSenhaResponse
)
from typing import List, Optional

router = APIRouter(prefix="/gestor", tags=["Gestor"])


def registrar_log(db, gestor_id, acao, descricao, ip=None):
    db.add(LogAtividade(gestor_id=gestor_id, acao=acao, descricao=descricao, ip=ip))
    db.commit()


@router.get("/perfil", response_model=GestorResponse)
def get_perfil(current_user=Depends(require_gestor), db: Session = Depends(get_db)):
    return current_user


@router.put("/perfil", response_model=GestorResponse)
def update_perfil(payload: GestorUpdate, request: Request, db: Session = Depends(get_db), current_user=Depends(require_gestor)):
    if payload.nome:
        current_user.nome = payload.nome
    if payload.email:
        existing = db.query(Gestor).filter(Gestor.email == payload.email, Gestor.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        current_user.email = payload.email
    db.commit()
    db.refresh(current_user)
    registrar_log(db, current_user.id, "perfil_atualizado", "Gestor atualizou o próprio perfil", str(request.client.host))
    return current_user

@router.get("/colaboradores", response_model=List[ColaboradorResponse])
def listar_colaboradores(
    ativo: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_gestor)
):
    query = db.query(Colaborador)
    if ativo is not None:
        query = query.filter(Colaborador.ativo == ativo)
    return query.all()


@router.post("/colaboradores", response_model=ColaboradorResponse, status_code=201)
def criar_colaborador(payload: ColaboradorCreate, request: Request, db: Session = Depends(get_db), current_user=Depends(require_gestor)):
    if db.query(Colaborador).filter(Colaborador.matricula == payload.matricula).first():
        raise HTTPException(status_code=400, detail="Matrícula já cadastrada")

    colaborador = Colaborador(
        matricula=payload.matricula,
        nome=payload.nome,
        cargo=payload.cargo,
        cpf=payload.cpf,
        senha_hash=hash_password(payload.senha),
        veiculo_id=payload.veiculo_id,
        cadastrado_por=current_user.id,
        primeiro_acesso=True
    )
    db.add(colaborador)
    db.commit()
    db.refresh(colaborador)
    registrar_log(db, current_user.id, "colaborador_criado", f"Criou colaborador {colaborador.matricula}", str(request.client.host))
    return colaborador


@router.get("/colaboradores/{colaborador_id}", response_model=ColaboradorResponse)
def get_colaborador(colaborador_id: int, db: Session = Depends(get_db), current_user=Depends(require_gestor)):
    colaborador = db.query(Colaborador).filter(Colaborador.id == colaborador_id).first()
    if not colaborador:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    return colaborador


@router.put("/colaboradores/{colaborador_id}", response_model=ColaboradorResponse)
def update_colaborador(colaborador_id: int, payload: ColaboradorUpdate, request: Request, db: Session = Depends(get_db), current_user=Depends(require_gestor)):
    colaborador = db.query(Colaborador).filter(Colaborador.id == colaborador_id).first()
    if not colaborador:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")

    if payload.nome is not None:
        colaborador.nome = payload.nome
    if payload.cargo is not None:
        colaborador.cargo = payload.cargo
    if payload.veiculo_id is not None:
        colaborador.veiculo_id = payload.veiculo_id
    if payload.ativo is not None:
        colaborador.ativo = payload.ativo

    db.commit()
    db.refresh(colaborador)
    registrar_log(db, current_user.id, "colaborador_atualizado", f"Atualizou colaborador {colaborador.matricula}", str(request.client.host))
    return colaborador


@router.post("/colaboradores/{colaborador_id}/redefinir-senha")
def redefinir_senha(colaborador_id: int, payload: RedefinirSenhaRequest, request: Request, db: Session = Depends(get_db), current_user=Depends(require_gestor)):
    colaborador = db.query(Colaborador).filter(Colaborador.id == colaborador_id).first()
    if not colaborador:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")

    colaborador.senha_hash = hash_password(payload.nova_senha)
    colaborador.primeiro_acesso = True

    historico = HistoricoSenha(
        colaborador_id=colaborador.id,
        gestor_id=current_user.id,
        observacao=payload.observacao
    )
    db.add(historico)
    db.commit()
    registrar_log(db, current_user.id, "senha_redefinida", f"Redefiniu senha do colaborador {colaborador.matricula}", str(request.client.host))
    return {"message": "Senha redefinida com sucesso"}


@router.get("/colaboradores/{colaborador_id}/historico-senha", response_model=List[HistoricoSenhaResponse])
def historico_senha(colaborador_id: int, db: Session = Depends(get_db), current_user=Depends(require_gestor)):
    return db.query(HistoricoSenha).filter(HistoricoSenha.colaborador_id == colaborador_id).order_by(HistoricoSenha.redefinida_em.desc()).all()


@router.get("/logs")
def listar_logs(limit: int = 100, db: Session = Depends(get_db), current_user=Depends(require_gestor)):
    logs = db.query(LogAtividade).order_by(LogAtividade.criado_em.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "acao": l.acao,
            "descricao": l.descricao,
            "ip": l.ip,
            "criado_em": l.criado_em,
            "gestor_id": l.gestor_id,
            "colaborador_id": l.colaborador_id
        }
        for l in logs
    ]
