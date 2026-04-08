from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime, timezone
import json

from core.database import get_db
from core.dependencies import require_gestor, require_colaborador, get_current_user
from models.checklist import Checklist, ChecklistFoto, Validacao, FOTOS_OBRIGATORIAS
from models.veiculo import Veiculo
from models.log import LogAtividade
from schemas.checklist import ChecklistResponse, ValidarChecklistRequest
from models.usuario import Colaborador
from services.upload_service import salvar_foto
router = APIRouter(prefix="/checklists", tags=["Checklist"])


def registrar_log(db, descricao, gestor_id=None, colaborador_id=None):
    db.add(LogAtividade(gestor_id=gestor_id, colaborador_id=colaborador_id, acao="checklist", descricao=descricao))
    db.commit()


# ── Colaborador: enviar checklist ─────────────────────────────────────────────

@router.post("", status_code=201)
async def criar_checklist(
    data_checklist: str = Form(...),
    km_atual: int = Form(...),
    respostas: str = Form(...),       # JSON string
    observacao: Optional[str] = Form(None),
    frente: UploadFile = File(...),
    lateral: UploadFile = File(...),
    pneu: UploadFile = File(...),
    interna: UploadFile = File(...),
    painel: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_colaborador)
):
    if not current_user.veiculo_id:
        raise HTTPException(status_code=400, detail="Nenhum veículo vinculado ao seu cadastro")

    veiculo = db.query(Veiculo).filter(Veiculo.id == current_user.veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    if veiculo.situacao and veiculo.situacao.lower() == "inativo":
        raise HTTPException(status_code=400, detail="Não é possível realizar checklist em veículo inativo")

    if veiculo.km_atual is not None and km_atual < veiculo.km_atual:
        raise HTTPException(
            status_code=400,
            detail=f"KM informado ({km_atual:,}) é inferior ao registrado no veículo ({veiculo.km_atual:,} km)"
        )

    try:
        respostas_dict = json.loads(respostas)
    except Exception:
        raise HTTPException(status_code=400, detail="Formato de respostas inválido")

    try:
        data = date.fromisoformat(data_checklist)
    except Exception:
        raise HTTPException(status_code=400, detail="Formato de data inválido (use YYYY-MM-DD)")

    checklist = Checklist(
        veiculo_id=current_user.veiculo_id,
        colaborador_id=current_user.id,
        data_checklist=data,
        km_atual=km_atual,
        respostas=respostas_dict,
        observacao=observacao,
        status="pendente"
    )
    db.add(checklist)
    db.flush()

    fotos_map = {
        "frente": frente,
        "lateral": lateral,
        "pneu": pneu,
        "interna": interna,
        "painel": painel
    }

    for tipo, upload in fotos_map.items():
        if not upload or not upload.filename:
            raise HTTPException(status_code=400, detail=f"Foto obrigatória ausente: {tipo}")
        caminho = await salvar_foto(upload, checklist.id, tipo)
        db.add(ChecklistFoto(
            checklist_id=checklist.id,
            tipo=tipo,
            caminho_arquivo=caminho,
            nome_original=upload.filename
        ))

    db.commit()
    db.refresh(checklist)
    registrar_log(db, f"Checklist #{checklist.id} enviado pelo colaborador {current_user.matricula}", colaborador_id=current_user.id)
    return {"message": "Checklist enviado com sucesso", "id": checklist.id}


# ── Colaborador: meus checklists ──────────────────────────────────────────────

@router.get("/meus", response_model=List[ChecklistResponse])
def meus_checklists(
    db: Session = Depends(get_db),
    current_user=Depends(require_colaborador)
):
    return (
        db.query(Checklist)
        .options(
            joinedload(Checklist.fotos),
            joinedload(Checklist.validacao),
            joinedload(Checklist.veiculo),
            joinedload(Checklist.colaborador),
        )
        .filter(Checklist.colaborador_id == current_user.id)
        .order_by(Checklist.criado_em.desc())
        .all()
    )


# ── Gestor: listar todos ──────────────────────────────────────────────────────

@router.get("", response_model=List[ChecklistResponse])
def listar_checklists(
    status: Optional[str] = None,
    veiculo_id: Optional[int] = None,
    colaborador_id: Optional[int] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_gestor)
):
    query = db.query(Checklist).options(
        joinedload(Checklist.fotos),
        joinedload(Checklist.validacao),
        joinedload(Checklist.veiculo),
        joinedload(Checklist.colaborador),
    )
    if status:
        query = query.filter(Checklist.status == status)
    if veiculo_id:
        query = query.filter(Checklist.veiculo_id == veiculo_id)
    if colaborador_id:
        query = query.filter(Checklist.colaborador_id == colaborador_id)
    if data_inicio:
        query = query.filter(Checklist.data_checklist >= data_inicio)
    if data_fim:
        query = query.filter(Checklist.data_checklist <= data_fim)
    return query.order_by(Checklist.criado_em.desc()).all()


@router.get("/dashboard")
def dashboard(
    data: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_gestor)
):
    consulta_data = data or date.today()

    total_hoje = db.query(func.count(Checklist.id)).filter(Checklist.data_checklist == consulta_data).scalar()
    pendentes = db.query(func.count(Checklist.id)).filter(Checklist.status == "pendente").scalar()
    aprovados = db.query(func.count(Checklist.id)).filter(Checklist.status == "aprovado").scalar()
    reprovados = db.query(func.count(Checklist.id)).filter(Checklist.status == "reprovado").scalar()

    # Todos os veículos sem checklist na data selecionada
    veiculos = db.query(Veiculo).all()
    veiculos_com_checklist = (
        db.query(Checklist.veiculo_id)
        .filter(Checklist.data_checklist == consulta_data)
        .distinct()
        .all()
    )
    ids_com_checklist = {v[0] for v in veiculos_com_checklist}
    sem_checklist = [
        {"id": v.id, "placa": v.placa, "modelo": v.modelo, "motorista_nome": v.motorista_nome}
        for v in veiculos if v.id not in ids_com_checklist
    ]

    semanal = []
    from datetime import timedelta
    for i in range(6, -1, -1):
        dia = date.today() - timedelta(days=i)
        count = db.query(func.count(Checklist.id)).filter(Checklist.data_checklist == dia).scalar()
        pendente_dia = db.query(func.count(Checklist.id)).filter(Checklist.data_checklist == dia, Checklist.status == "pendente").scalar()
        aprovado_dia = db.query(func.count(Checklist.id)).filter(Checklist.data_checklist == dia, Checklist.status == "aprovado").scalar()
        reprovado_dia = db.query(func.count(Checklist.id)).filter(Checklist.data_checklist == dia, Checklist.status == "reprovado").scalar()
        semanal.append({
            "data": dia.isoformat(),
            "total": count,
            "pendente": pendente_dia,
            "aprovado": aprovado_dia,
            "reprovado": reprovado_dia
        })

    return {
        "resumo": {
            "total_hoje": total_hoje,
            "pendentes": pendentes,
            "aprovados": aprovados,
            "reprovados": reprovados,
            "veiculos_sem_checklist_hoje": len(sem_checklist)
        },
        "veiculos_sem_checklist": sem_checklist,
        "grafico_semanal": semanal
    }

@router.get("/{checklist_id}", response_model=ChecklistResponse)
def get_checklist(checklist_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    checklist = (
        db.query(Checklist)
        .options(
            joinedload(Checklist.fotos),
            joinedload(Checklist.validacao),
            joinedload(Checklist.veiculo),
            joinedload(Checklist.colaborador),
        )
        .filter(Checklist.id == checklist_id)
        .first()
    )
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist não encontrado")

    # Colaborador só pode ver o próprio
    if current_user.role == "colaborador" and checklist.colaborador_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")

    return checklist

@router.patch("/{checklist_id}/validar")
def validar_checklist(
    checklist_id: int,
    payload: ValidarChecklistRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_gestor)
):
    if payload.decisao not in ("aprovado", "reprovado"):
        raise HTTPException(status_code=400, detail="Decisão inválida. Use 'aprovado' ou 'reprovado'")
    if payload.decisao == "reprovado" and not payload.justificativa:
        raise HTTPException(status_code=400, detail="Justificativa obrigatória em caso de reprovação")

    checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist não encontrado")
    if checklist.status != "pendente":
        raise HTTPException(status_code=400, detail="Checklist já foi validado")

    # Automação: muda status automaticamente
    checklist.status = payload.decisao
    checklist.atualizado_em = datetime.now(timezone.utc)

    if payload.decisao == "aprovado":
        veiculo = db.query(Veiculo).filter(Veiculo.id == checklist.veiculo_id).first()
        if veiculo and checklist.km_atual is not None:
            if veiculo.km_atual is None or checklist.km_atual > veiculo.km_atual:
                veiculo.km_atual = checklist.km_atual
                veiculo.data_km_atual = checklist.data_checklist

    validacao = Validacao(
        checklist_id=checklist.id,
        gestor_id=current_user.id,
        decisao=payload.decisao,
        justificativa=payload.justificativa,
    )
    db.add(validacao)
    db.commit()

    registrar_log(db, f"Checklist #{checklist.id} {payload.decisao} pelo gestor {current_user.matricula}", gestor_id=current_user.id)
    return {"message": f"Checklist {payload.decisao} com sucesso"}

@router.get("/historico/veiculo/{veiculo_id}", response_model=List[ChecklistResponse])
def historico_veiculo(
    veiculo_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_gestor)
):
    veiculo = db.query(Veiculo).filter(Veiculo.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")

    return (
        db.query(Checklist)
        .options(
            joinedload(Checklist.fotos),
            joinedload(Checklist.validacao),
            joinedload(Checklist.veiculo),
            joinedload(Checklist.colaborador),
        )
        .filter(Checklist.veiculo_id == veiculo_id)
        .order_by(Checklist.data_checklist.desc())
        .all()
    )
