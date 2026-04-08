from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    SECRET_KEY: str = "dev-secret-key-troque-em-producao"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    GESTOR_MATRICULA: str = "G0001"
    GESTOR_NOME: str = "Administrador"
    GESTOR_EMAIL: str = "admin@empresa.com"
    GESTOR_SENHA: str = "Admin@2026"

    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10

    DATABASE_URL: str = "sqlite:///./checklist_veiculos.db"

    @property
    def database_url_resolved(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    class Config:
        env_file = ".env"


settings = Settings()
