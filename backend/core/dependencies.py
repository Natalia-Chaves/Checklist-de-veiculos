from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import decode_token
from models.usuario import Gestor, Colaborador

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido ou expirado")

    role = payload.get("role")
    matricula = payload.get("sub")

    if role == "gestor":
        user = db.query(Gestor).filter(Gestor.matricula == matricula, Gestor.ativo == True).first()
    elif role == "colaborador":
        user = db.query(Colaborador).filter(Colaborador.matricula == matricula, Colaborador.ativo == True).first()
    else:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Role inválido")

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado")

    user.role = role
    return user


def require_gestor(current_user=Depends(get_current_user)):
    if current_user.role != "gestor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito a gestores")
    return current_user


def require_colaborador(current_user=Depends(get_current_user)):
    if current_user.role != "colaborador":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito a colaboradores")
    return current_user
