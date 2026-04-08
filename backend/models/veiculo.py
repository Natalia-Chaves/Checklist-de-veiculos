from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from core.database import Base


class ResponsavelManutencao(Base):
    __tablename__ = "responsaveis_manutencao"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    telefone = Column(String(20), nullable=True)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    veiculos = relationship("Veiculo", back_populates="responsavel_manutencao")


class Veiculo(Base):
    __tablename__ = "veiculos"

    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String(10), unique=True, nullable=False, index=True)
    tipo_veiculo = Column(String(50))
    motorista_nome = Column(String(100))
    cpf_motorista = Column(String(20))
    modelo = Column(String(100))
    seguradora = Column(String(100))
    apolice = Column(String(50))
    inclusao = Column(Date, nullable=True)
    proprietario = Column(String(100))
    tipo_proprietario = Column(String(50))
    cc = Column(String(20))
    situacao = Column(String(20), default="Ativo")
    ano_fabricacao = Column(Integer, nullable=True)
    ano_modelo = Column(Integer, nullable=True)
    numero_frota = Column(String(20))
    chassi = Column(String(50))
    renavam = Column(String(50))
    tipo_seguro = Column(String(50))
    franquia = Column(String(20))
    mensal = Column(String(20))
    km_atual = Column(Integer, nullable=True)
    data_km_atual = Column(Date, nullable=True)
    cidade = Column(String(100))
    estado = Column(String(10))
    cargo = Column(String(100))
    funcao = Column(String(100))
    situacao_motorista = Column(String(20))
    tracao_4x4 = Column(Boolean, default=False)
    cor = Column(String(30))
    removido_em = Column(Date, nullable=True)

    responsavel_manutencao_id = Column(Integer, ForeignKey("responsaveis_manutencao.id"), nullable=True)
    responsavel_manutencao = relationship("ResponsavelManutencao", back_populates="veiculos")

    colaborador = relationship("Colaborador", back_populates="veiculo", uselist=False)
    checklists = relationship("Checklist", back_populates="veiculo")
