from pydantic import BaseModel
from typing import Optional


class ConfiguracaoRelatorioUpdate(BaseModel):
    ativo: Optional[bool] = None
    frequencia: Optional[str] = None   
    dia_semana: Optional[int] = None  
    horario: Optional[str] = None    


class ConfiguracaoRelatorioResponse(BaseModel):
    id: int
    gestor_id: int
    ativo: bool
    frequencia: str
    dia_semana: int
    horario: str

    class Config:
        from_attributes = True
