from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import date, datetime


class VeiculoSimplesChecklist(BaseModel):
    id: int
    placa: str
    modelo: Optional[str]
    tipo_veiculo: Optional[str] = None

    class Config:
        from_attributes = True


class ColaboradorSimplesChecklist(BaseModel):
    id: int
    nome: str
    matricula: str
    cpf: Optional[str]

    class Config:
        from_attributes = True


class ChecklistCreate(BaseModel):
    data_checklist: date
    km_atual: int
    respostas: Dict[str, bool]
    observacao: Optional[str] = None


class ChecklistFotoResponse(BaseModel):
    id: int
    tipo: str
    caminho_arquivo: str
    nome_original: Optional[str]
    enviado_em: datetime

    class Config:
        from_attributes = True


class ValidacaoResponse(BaseModel):
    id: int
    gestor_id: int
    decisao: str
    justificativa: Optional[str]
    validado_em: datetime

    class Config:
        from_attributes = True


class ChecklistResponse(BaseModel):
    id: int
    veiculo_id: int
    colaborador_id: int
    data_checklist: date
    km_atual: int
    respostas: Dict
    observacao: Optional[str]
    status: str
    criado_em: datetime
    fotos: List[ChecklistFotoResponse] = []
    validacao: Optional[ValidacaoResponse] = None
    veiculo: Optional[VeiculoSimplesChecklist] = None
    colaborador: Optional[ColaboradorSimplesChecklist] = None

    class Config:
        from_attributes = True


class ValidarChecklistRequest(BaseModel):
    decisao: str  # aprovado | reprovado
    justificativa: Optional[str] = None


class FiltroRelatorio(BaseModel):
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    veiculo_id: Optional[int] = None
    colaborador_id: Optional[int] = None
    status: Optional[str] = None
