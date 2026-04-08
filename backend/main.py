from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from pathlib import Path
import os
import logging

from core.database import engine, Base
from core.config import settings
import models  

from routes import auth, gestor, veiculos, checklist, relatorio

logging.basicConfig(level=logging.INFO)

STATIC_DIR = Path(__file__).parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield

app = FastAPI(
    title="Checklist de Veículos API",
    description="Checklist de Veículos — Gestão de Frota",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


app.include_router(auth.router, prefix="/api")
app.include_router(gestor.router, prefix="/api")
app.include_router(veiculos.router, prefix="/api")
app.include_router(checklist.router, prefix="/api")
app.include_router(relatorio.router, prefix="/api")


@app.get("/api", tags=["Health"])
def health():
    return {"status": "ok", "sistema": "Checklist de Veículos API v1.0.0"}


if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR / "static")), name="react-static")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))
