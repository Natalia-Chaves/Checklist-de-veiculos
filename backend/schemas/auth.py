from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    matricula: str
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    nome: str
    matricula: str
    primeiro_acesso: bool


class TrocarSenhaRequest(BaseModel):
    senha_atual: str
    nova_senha: str
    confirmar_senha: str
