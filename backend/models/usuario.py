from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from core.database import Base


class Gestor(Base):
    __tablename__ = "gestores"

    id = Column(Integer, primary_key=True, index=True)
    matricula = Column(String(20), unique=True, nullable=False, index=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    ativo = Column(Boolean, default=True)
    primeiro_acesso = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    colaboradores_cadastrados = relationship("Colaborador", back_populates="cadastrado_por_gestor")
    validacoes = relationship("Validacao", back_populates="gestor")
    config_relatorio = relationship("ConfiguracaoRelatorio", back_populates="gestor", uselist=False)
    logs = relationship("LogAtividade", back_populates="gestor")
    historico_senha = relationship("HistoricoSenha", back_populates="gestor")


class Colaborador(Base):
    __tablename__ = "colaboradores"

    id = Column(Integer, primary_key=True, index=True)
    matricula = Column(String(20), unique=True, nullable=False, index=True)
    nome = Column(String(100), nullable=False)
    cargo = Column(String(100), nullable=False)
    cpf = Column(String(20), nullable=True, index=True)
    senha_hash = Column(String(255), nullable=False)
    ativo = Column(Boolean, default=True)
    primeiro_acesso = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    cadastrado_por = Column(Integer, ForeignKey("gestores.id"), nullable=False)

    veiculo_id = Column(Integer, ForeignKey("veiculos.id"), nullable=True)

    cadastrado_por_gestor = relationship("Gestor", back_populates="colaboradores_cadastrados")
    veiculo = relationship("Veiculo", back_populates="colaborador")
    checklists = relationship("Checklist", back_populates="colaborador")


class HistoricoSenha(Base):
    __tablename__ = "historico_senhas"

    id = Column(Integer, primary_key=True, index=True)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False)
    gestor_id = Column(Integer, ForeignKey("gestores.id"), nullable=False)
    redefinida_em = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    observacao = Column(Text, nullable=True)

    colaborador = relationship("Colaborador")
    gestor = relationship("Gestor", back_populates="historico_senha")
