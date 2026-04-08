from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class ColaboradorCreate(BaseModel):
    matricula: str
    nome: str
    cargo: str
    senha: str
    cpf: Optional[str] = None  
    veiculo_id: Optional[int] = None

class ColaboradorUpdate(BaseModel):
    nome: Optional[str] = None
    cargo: Optional[str] = None
    ativo: Optional[bool] = None
    cpf: Optional[str] = None  
    veiculo_id: Optional[int] = None

class ColaboradorResponse(BaseModel):
    id: int
    matricula: str
    nome: str
    cargo: str
    ativo: bool
    primeiro_acesso: bool
    criado_em: datetime
    veiculo_id: Optional[int] = None

    class Config:
        from_attributes = True


class RedefinirSenhaRequest(BaseModel):
    nova_senha: str
    observacao: Optional[str] = None


class GestorUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None


class GestorResponse(BaseModel):
    id: int
    matricula: str
    nome: str
    email: str
    ativo: bool
    criado_em: datetime

    class Config:
        from_attributes = True


class HistoricoSenhaResponse(BaseModel):
    id: int
    colaborador_id: int
    gestor_id: int
    redefinida_em: datetime
    observacao: Optional[str] = None

    class Config:
        from_attributes = True
