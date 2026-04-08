from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import verify_password, hash_password, create_access_token
from core.dependencies import get_current_user
from models.usuario import Gestor, Colaborador
from models.log import LogAtividade
from schemas.auth import LoginRequest, TokenResponse, TrocarSenhaRequest

router = APIRouter(prefix="/auth", tags=["Autenticação"])


def _log(db, descricao, gestor_id=None, colaborador_id=None, ip=None):
    db.add(LogAtividade(
        gestor_id=gestor_id,
        colaborador_id=colaborador_id,
        acao="login" if "login" in descricao.lower() else "acao",
        descricao=descricao,
        ip=ip
    ))
    db.commit()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    # Tenta gestor primeiro
    gestor = db.query(Gestor).filter(Gestor.matricula == payload.matricula, Gestor.ativo == True).first()
    if gestor and verify_password(payload.senha, gestor.senha_hash):
        token = create_access_token({"sub": gestor.matricula, "role": "gestor"})
        _log(db, f"Login gestor: {gestor.matricula}", gestor_id=gestor.id, ip=str(request.client.host))
        return TokenResponse(
            access_token=token,
            role="gestor",
            nome=gestor.nome,
            matricula=gestor.matricula,
            primeiro_acesso=gestor.primeiro_acesso
        )

    # Tenta colaborador
    colaborador = db.query(Colaborador).filter(Colaborador.matricula == payload.matricula, Colaborador.ativo == True).first()
    if colaborador and verify_password(payload.senha, colaborador.senha_hash):
        token = create_access_token({"sub": colaborador.matricula, "role": "colaborador"})
        _log(db, f"Login colaborador: {colaborador.matricula}", colaborador_id=colaborador.id, ip=str(request.client.host))
        return TokenResponse(
            access_token=token,
            role="colaborador",
            nome=colaborador.nome,
            matricula=colaborador.matricula,
            primeiro_acesso=colaborador.primeiro_acesso
        )

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Matrícula ou senha incorretos")


@router.post("/trocar-senha")
def trocar_senha(payload: TrocarSenhaRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if payload.nova_senha != payload.confirmar_senha:
        raise HTTPException(status_code=400, detail="As senhas não conferem")
    if len(payload.nova_senha) < 6:
        raise HTTPException(status_code=400, detail="A senha deve ter pelo menos 6 caracteres")

    if not verify_password(payload.senha_atual, current_user.senha_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")

    current_user.senha_hash = hash_password(payload.nova_senha)
    current_user.primeiro_acesso = False
    db.commit()

    return {"message": "Senha alterada com sucesso"}


@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return {
        "id": current_user.id,
        "matricula": current_user.matricula,
        "nome": current_user.nome,
        "role": current_user.role,
        "primeiro_acesso": current_user.primeiro_acesso
    }
