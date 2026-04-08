import os
import uuid
from fastapi import UploadFile, HTTPException
from core.config import settings

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_SIZE_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024


async def salvar_foto(upload: UploadFile, checklist_id: int, tipo: str) -> str:
    if upload.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Formato inválido para foto '{tipo}'. Use JPG, PNG ou WEBP.")

    conteudo = await upload.read()
    if len(conteudo) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail=f"Foto '{tipo}' excede o tamanho máximo de {settings.MAX_FILE_SIZE_MB}MB")

    extensao = upload.filename.rsplit(".", 1)[-1].lower() if "." in upload.filename else "jpg"
    nome_arquivo = f"{checklist_id}_{tipo}_{uuid.uuid4().hex}.{extensao}"

    pasta = os.path.join(settings.UPLOAD_DIR, str(checklist_id))
    os.makedirs(pasta, exist_ok=True)

    caminho = os.path.join(pasta, nome_arquivo)
    with open(caminho, "wb") as f:
        f.write(conteudo)

    return caminho.replace("\\", "/")
