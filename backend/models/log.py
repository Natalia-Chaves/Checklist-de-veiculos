from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Time
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from core.database import Base


class LogAtividade(Base):
    __tablename__ = "logs_atividade"

    id = Column(Integer, primary_key=True, index=True)
    gestor_id = Column(Integer, ForeignKey("gestores.id"), nullable=True)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=True)
    acao = Column(String(100), nullable=False)
    descricao = Column(Text, nullable=True)
    ip = Column(String(50), nullable=True)
    criado_em = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    gestor = relationship("Gestor", back_populates="logs")
    colaborador = relationship("Colaborador")


class ConfiguracaoRelatorio(Base):
    __tablename__ = "configuracoes_relatorio"

    id = Column(Integer, primary_key=True, index=True)
    gestor_id = Column(Integer, ForeignKey("gestores.id"), unique=True, nullable=False)
    ativo = Column(Boolean, default=True)
    frequencia = Column(String(20), default="semanal") 
    dia_semana = Column(Integer, default=1)  # 1=Segunda ... 7=Domingo
    horario = Column(String(10), default="08:00") 
    ultimo_envio = Column(DateTime, nullable=True)
    atualizado_em = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    gestor = relationship("Gestor", back_populates="config_relatorio")
