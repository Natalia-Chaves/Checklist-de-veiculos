from pydantic import BaseModel
from typing import Optional
from datetime import date


class ResponsavelSimples(BaseModel):
    id: int
    nome: str

    class Config:
        from_attributes = True


class VeiculoResponse(BaseModel):
    id: int
    placa: str
    tipo_veiculo: Optional[str]
    motorista_nome: Optional[str]
    modelo: Optional[str]
    situacao: Optional[str]
    numero_frota: Optional[str]
    ano_fabricacao: Optional[int]
    ano_modelo: Optional[int]
    km_atual: Optional[int]
    cidade: Optional[str]
    estado: Optional[str]
    cor: Optional[str]
    seguradora: Optional[str]
    apolice: Optional[str]
    inclusao: Optional[date] = None
    proprietario: Optional[str]
    tipo_proprietario: Optional[str]
    cc: Optional[str]
    chassi: Optional[str]
    renavam: Optional[str]
    tipo_seguro: Optional[str]
    franquia: Optional[str]
    data_km_atual: Optional[date] = None
    responsavel_manutencao_id: Optional[int]
    responsavel_manutencao: Optional[ResponsavelSimples] = None

    class Config:
        from_attributes = True


class VeiculoColaboradorResponse(BaseModel):
    id: int
    placa: str
    modelo: Optional[str]
    numero_frota: Optional[str]
    tipo_veiculo: Optional[str]
    cor: Optional[str]
    tracao_4x4: Optional[bool] = False
    ano_fabricacao: Optional[int]
    ano_modelo: Optional[int]
    chassi: Optional[str]
    renavam: Optional[str]
    seguradora: Optional[str]
    apolice: Optional[str]
    tipo_seguro: Optional[str]
    franquia: Optional[str]
    situacao: Optional[str]
    cidade: Optional[str]
    estado: Optional[str]
    km_atual: Optional[int]
    data_km_atual: Optional[date] = None
    proprietario: Optional[str]
    responsavel_manutencao: Optional[ResponsavelSimples] = None

    class Config:
        from_attributes = True


class VeiculoCreate(BaseModel):
    placa: str
    modelo: Optional[str] = None
    tipo_veiculo: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    situacao: Optional[str] = "Ativo"
    responsavel_manutencao_id: Optional[int] = None
    seguradora: Optional[str] = None
    apolice: Optional[str] = None
    inclusao: Optional[date] = None
    proprietario: Optional[str] = None
    tipo_proprietario: Optional[str] = None
    cc: Optional[str] = None
    ano_fabricacao: Optional[int] = None
    ano_modelo: Optional[int] = None
    numero_frota: Optional[str] = None
    chassi: Optional[str] = None
    renavam: Optional[str] = None
    tipo_seguro: Optional[str] = None
    franquia: Optional[str] = None
    km_atual: Optional[int] = None
    data_km_atual: Optional[date] = None


class VeiculoUpdate(BaseModel):
    modelo: Optional[str] = None
    tipo_veiculo: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    situacao: Optional[str] = None
    responsavel_manutencao_id: Optional[int] = None
    seguradora: Optional[str] = None
    apolice: Optional[str] = None
    inclusao: Optional[date] = None
    proprietario: Optional[str] = None
    tipo_proprietario: Optional[str] = None
    cc: Optional[str] = None
    ano_fabricacao: Optional[int] = None
    ano_modelo: Optional[int] = None
    numero_frota: Optional[str] = None
    chassi: Optional[str] = None
    renavam: Optional[str] = None
    tipo_seguro: Optional[str] = None
    franquia: Optional[str] = None
    km_atual: Optional[int] = None
    data_km_atual: Optional[date] = None


class ResponsavelManutencaoCreate(BaseModel):
    nome: str
    telefone: Optional[str] = None


class ResponsavelManutencaoUpdate(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None


class ResponsavelManutencaoResponse(BaseModel):
    id: int
    nome: str
    telefone: Optional[str]
    ativo: bool

    class Config:
        from_attributes = True
