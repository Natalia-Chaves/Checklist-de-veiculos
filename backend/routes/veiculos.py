from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from core.database import get_db
from core.dependencies import require_gestor, get_current_user
from models.veiculo import Veiculo, ResponsavelManutencao
from models.log import LogAtividade
from schemas.veiculo import (
    VeiculoResponse, VeiculoColaboradorResponse, VeiculoUpdate, VeiculoCreate,
    ResponsavelManutencaoCreate, ResponsavelManutencaoUpdate, ResponsavelManutencaoResponse
)

router = APIRouter(prefix="/veiculos", tags=["Veículos"])


def registrar_log(db, descricao, gestor_id=None):
    db.add(LogAtividade(gestor_id=gestor_id, acao="veiculo", descricao=descricao))
    db.commit()


@router.get("", response_model=List[VeiculoResponse])
def listar_veiculos(
    situacao: Optional[str] = None,
    cidade: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_gestor)
):
    query = db.query(Veiculo).options(joinedload(Veiculo.responsavel_manutencao))
    if situacao:
        query = query.filter(Veiculo.situacao == situacao)
    if cidade:
        query = query.filter(Veiculo.cidade == cidade)
    return query.all()


@router.post("", response_model=VeiculoResponse, status_code=201)
def criar_veiculo(payload: VeiculoCreate, db: Session = Depends(get_db), current_user=Depends(require_gestor)):
    placa = payload.placa.strip().upper()
    if db.query(Veiculo).filter(Veiculo.placa == placa).first():
        raise HTTPException(status_code=400, detail="Placa já cadastrada")
    dados = payload.model_dump()
    dados['placa'] = placa
    veiculo = Veiculo(**dados)
    db.add(veiculo)
    db.commit()
    db.refresh(veiculo)
    registrar_log(db, f"Veículo {veiculo.placa} cadastrado pelo gestor {current_user.matricula}", gestor_id=current_user.id)
    return veiculo


@router.get("/meu-veiculo", response_model=VeiculoColaboradorResponse)
def get_meu_veiculo(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "colaborador":
        raise HTTPException(status_code=403, detail="Rota exclusiva para colaboradores")
    if not current_user.veiculo_id:
        raise HTTPException(status_code=404, detail="Nenhum veículo vinculado ao seu cadastro")
    veiculo = db.query(Veiculo).options(joinedload(Veiculo.responsavel_manutencao)).filter(Veiculo.id == current_user.veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    return veiculo


@router.get("/{veiculo_id}", response_model=VeiculoResponse)
def get_veiculo(veiculo_id: int, db: Session = Depends(get_db), current_user=Depends(require_gestor)):
    veiculo = db.query(Veiculo).filter(Veiculo.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    return veiculo


@router.put("/{veiculo_id}", response_model=VeiculoResponse)
def update_veiculo(veiculo_id: int, payload: VeiculoUpdate, db: Session = Depends(get_db), current_user=Depends(require_gestor)):
    veiculo = db.query(Veiculo).filter(Veiculo.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    updates = payload.model_dump(exclude_unset=True)
    if 'km_atual' in updates and updates['km_atual'] is not None:
        if veiculo.km_atual is not None and updates['km_atual'] < veiculo.km_atual:
            raise HTTPException(status_code=400, detail=f"KM não pode ser inferior ao atual ({veiculo.km_atual:,} km)")
    for field, value in updates.items():
        setattr(veiculo, field, value)
    db.commit()
    db.refresh(veiculo)
    registrar_log(db, f"Veículo {veiculo.placa} atualizado pelo gestor {current_user.matricula}", gestor_id=current_user.id)
    return veiculo


@router.get("/responsaveis/manutencao", response_model=List[ResponsavelManutencaoResponse])
def listar_responsaveis(db: Session = Depends(get_db), current_user=Depends(require_gestor)):
    return db.query(ResponsavelManutencao).filter(ResponsavelManutencao.ativo == True).all()


@router.post("/responsaveis/manutencao", response_model=ResponsavelManutencaoResponse, status_code=201)
def criar_responsavel(payload: ResponsavelManutencaoCreate, db: Session = Depends(get_db), current_user=Depends(require_gestor)):
    responsavel = ResponsavelManutencao(**payload.model_dump())
    db.add(responsavel)
    db.commit()
    db.refresh(responsavel)
    return responsavel


@router.put("/responsaveis/manutencao/{responsavel_id}", response_model=ResponsavelManutencaoResponse)
def update_responsavel(responsavel_id: int, payload: ResponsavelManutencaoUpdate, db: Session = Depends(get_db), current_user=Depends(require_gestor)):
    responsavel = db.query(ResponsavelManutencao).filter(ResponsavelManutencao.id == responsavel_id).first()
    if not responsavel:
        raise HTTPException(status_code=404, detail="Responsável não encontrado")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(responsavel, field, value)
    db.commit()
    db.refresh(responsavel)
    return responsavel
