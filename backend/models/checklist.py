from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Date
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from core.database import Base


FOTOS_OBRIGATORIAS = ["frente", "lateral", "pneu", "interna", "painel"]

PERGUNTAS_PADRAO = [
    "documentacao_em_dia",
    "equipamentos_obrigatorios",
    "avarias_visiveis",
    "apto_para_uso",
    "pneus_condicao_adequada",
    "nivel_combustivel",
]


class Checklist(Base):
    __tablename__ = "checklists"

    id = Column(Integer, primary_key=True, index=True)
    veiculo_id = Column(Integer, ForeignKey("veiculos.id"), nullable=False)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False)

    data_checklist = Column(Date, nullable=False)
    km_atual = Column(Integer, nullable=False)

    respostas = Column(JSON, nullable=False)

    observacao = Column(Text, nullable=True)

    status = Column(String(20), default="pendente")  # pendente | aprovado | reprovado
    notificacao_lida = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    atualizado_em = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    veiculo = relationship("Veiculo", back_populates="checklists")
    colaborador = relationship("Colaborador", back_populates="checklists")
    fotos = relationship("ChecklistFoto", back_populates="checklist", cascade="all, delete-orphan")
    validacao = relationship("Validacao", back_populates="checklist", uselist=False)


class ChecklistFoto(Base):
    __tablename__ = "checklist_fotos"

    id = Column(Integer, primary_key=True, index=True)
    checklist_id = Column(Integer, ForeignKey("checklists.id"), nullable=False)
    tipo = Column(String(20), nullable=False)  # frente | lateral | pneu | interna | painel
    caminho_arquivo = Column(String(255), nullable=False)
    nome_original = Column(String(255))
    enviado_em = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    checklist = relationship("Checklist", back_populates="fotos")


class Validacao(Base):
    __tablename__ = "validacoes"

    id = Column(Integer, primary_key=True, index=True)
    checklist_id = Column(Integer, ForeignKey("checklists.id"), unique=True, nullable=False)
    gestor_id = Column(Integer, ForeignKey("gestores.id"), nullable=False)
    decisao = Column(String(20), nullable=False)  # aprovado | reprovado
    justificativa = Column(Text, nullable=True)
    validado_em = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    checklist = relationship("Checklist", back_populates="validacao")
    gestor = relationship("Gestor", back_populates="validacoes")
