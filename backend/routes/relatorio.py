from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
import io

from core.database import get_db
from core.dependencies import require_gestor
from models.log import ConfiguracaoRelatorio
from schemas.relatorio import ConfiguracaoRelatorioUpdate, ConfiguracaoRelatorioResponse
from services.relatorio_service import gerar_relatorio_excel, gerar_relatorio_pdf

router = APIRouter(prefix="/relatorio", tags=["Relatório"])


@router.get("/configuracao", response_model=ConfiguracaoRelatorioResponse)
def get_configuracao(db: Session = Depends(get_db), current_user=Depends(require_gestor)):
    config = db.query(ConfiguracaoRelatorio).filter(ConfiguracaoRelatorio.gestor_id == current_user.id).first()
    if not config:
        config = ConfiguracaoRelatorio(gestor_id=current_user.id)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.put("/configuracao", response_model=ConfiguracaoRelatorioResponse)
def update_configuracao(payload: ConfiguracaoRelatorioUpdate, db: Session = Depends(get_db), current_user=Depends(require_gestor)):
    config = db.query(ConfiguracaoRelatorio).filter(ConfiguracaoRelatorio.gestor_id == current_user.id).first()
    if not config:
        config = ConfiguracaoRelatorio(gestor_id=current_user.id)
        db.add(config)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(config, field, value)

    db.commit()
    db.refresh(config)
    return config


# ── Geração sob demanda ───────────────────────────────────────────────────────

@router.get("/excel")
def download_excel(
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    veiculo_id: Optional[int] = Query(None),
    colaborador_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_gestor)
):
    filtros = {
        "data_inicio": data_inicio,
        "data_fim": data_fim,
        "veiculo_id": veiculo_id,
        "colaborador_id": colaborador_id,
        "status": status
    }
    buffer = gerar_relatorio_excel(db, filtros)
    return StreamingResponse(
        io.BytesIO(buffer),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=relatorio_frota.xlsx"}
    )


@router.get("/pdf")
def download_pdf(
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    veiculo_id: Optional[int] = Query(None),
    colaborador_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_gestor)
):
    filtros = {
        "data_inicio": data_inicio,
        "data_fim": data_fim,
        "veiculo_id": veiculo_id,
        "colaborador_id": colaborador_id,
        "status": status
    }
    buffer = gerar_relatorio_pdf(db, filtros)
    return StreamingResponse(
        io.BytesIO(buffer),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=relatorio_frota.pdf"}
    )
