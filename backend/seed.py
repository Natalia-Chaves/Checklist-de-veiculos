import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from core.database import engine, SessionLocal, Base
from core.security import hash_password
from core.config import settings
import models  

from models.usuario import Gestor, Colaborador
from models.veiculo import Veiculo, ResponsavelManutencao
from models.log import ConfiguracaoRelatorio

import pandas as pd
from datetime import datetime


def criar_tabelas():
    Base.metadata.create_all(bind=engine)
    print("Tabelas criadas")


def criar_gestor_raiz(db):
    existente = db.query(Gestor).filter(Gestor.matricula == settings.GESTOR_MATRICULA).first()
    if existente:
        print(f"Gestor raiz já existe: {settings.GESTOR_MATRICULA}")
        return existente

    gestor = Gestor(
        matricula=settings.GESTOR_MATRICULA,
        nome=settings.GESTOR_NOME,
        email=settings.GESTOR_EMAIL,
        senha_hash=hash_password(settings.GESTOR_SENHA),
        ativo=True,
        primeiro_acesso=False
    )
    db.add(gestor)
    db.flush()

    config = ConfiguracaoRelatorio(
        gestor_id=gestor.id,
        ativo=True,
        frequencia="semanal",
        dia_semana=2,  
        horario="08:00"
    )
    db.add(config)
    db.commit()
    print(f"Gestor raiz criado: {settings.GESTOR_MATRICULA} / {settings.GESTOR_EMAIL}")
    return gestor


def importar_frota(db, caminho_excel: str):
    if not os.path.exists(caminho_excel):
        print(f"Arquivo não encontrado: {caminho_excel}. Pulando importação da frota.")
        return

    existentes = db.query(Veiculo).count()
    if existentes > 0:
        print(f"Base de frota já importada ({existentes} veículos). Pulando.")
        return

    df = pd.read_excel(caminho_excel, sheet_name="Base_Frota")

    def safe(val):
        if pd.isna(val):
            return None
        return val

    def safe_int(val):
        try:
            return int(val) if pd.notna(val) else None
        except Exception:
            return None

    def safe_date(val):
        try:
            if pd.isna(val):
                return None
            if hasattr(val, 'date'):
                return val.date()
            return None
        except Exception:
            return None

    count = 0
    for _, row in df.iterrows():
        tracao = False
        if pd.notna(row.get("TRAÇÃO 4X4", "")):
            tracao = str(row.get("TRAÇÃO 4X4", "")).strip().lower() == "sim"

        veiculo = Veiculo(
            placa=str(row["PLACA"]).strip(),
            tipo_veiculo=safe(row.get("TIPO VEÍCULO")),
            motorista_nome=safe(row.get("MOTORISTA")),
            cpf_motorista=safe(row.get("CPF MOTORISTA")),
            modelo=safe(row.get("MODELO VEÍCULO")),
            seguradora=safe(row.get("SEGURADORA")),
            apolice=safe(row.get("APÓLICE")),
            inclusao=safe_date(row.get("INCLUSÃO")),
            proprietario=safe(row.get("PROPRIETÁRIO")),
            tipo_proprietario=safe(row.get("TIPO PROPRIETÁRIO")),
            cc=safe(row.get("CC")),
            situacao=safe(row.get("SITUAÇÃO VEÍCULO")) or "Ativo",
            ano_fabricacao=safe_int(row.get("ANO FABRICAÇÃO")),
            ano_modelo=safe_int(row.get("ANO MODELO")),
            numero_frota=safe(row.get("Nº FROTA")),
            chassi=safe(row.get("CHASSI")),
            renavam=safe(row.get("RENAVAM")),
            tipo_seguro=safe(row.get("TIPO SEGURO")),
            franquia=safe(row.get("FRANQUIA")),
            mensal=safe(row.get("MENSAL")),
            km_atual=safe_int(row.get("KM ATUAL")),
            data_km_atual=safe_date(row.get("DATA KM ATUAL")),
            cidade=safe(row.get("CIDADE")),
            estado=safe(row.get("ESTADO")),
            cargo=safe(row.get("CARGO")),
            funcao=safe(row.get("FUNÇÃO")),
            situacao_motorista=safe(row.get("SITUAÇÃO MOTORISTA")),
            tracao_4x4=tracao,
            cor=safe(row.get("COR")),
            removido_em=safe_date(row.get("REMOVIDO DA FROTA EM")),
        )
        db.add(veiculo)
        count += 1

    db.commit()
    print(f"{count} veículos importados da base de frota")


def criar_colaboradores_motoristas(db, caminho_excel: str, gestor_id: int):
    if not os.path.exists(caminho_excel):
        print(f"Arquivo não encontrado: {caminho_excel}. Pulando criação de colaboradores.")
        return

    existentes = db.query(Colaborador).count()
    if existentes > 0:
        print(f"Colaboradores já existem ({existentes}). Pulando.")
        return

    df = pd.read_excel(caminho_excel, sheet_name="Base_Frota")

    motoristas_unicos = df[['MOTORISTA', 'CPF MOTORISTA', 'CARGO']].dropna(subset=['CPF MOTORISTA']).drop_duplicates(subset=['CPF MOTORISTA'])

    matricula_counter = 1
    colaboradores_criados = 0

    for _, row in motoristas_unicos.iterrows():
        cpf = str(row['CPF MOTORISTA']).strip()
        nome = str(row['MOTORISTA']).strip()
        cargo = str(row.get('CARGO', 'Motorista')).strip() if pd.notna(row.get('CARGO')) else 'Motorista'

        matricula = f"C{matricula_counter:04d}"
        ano_atual = datetime.now().year
        senha_gerada = f"{matricula}@{ano_atual}"

        colaborador = Colaborador(
            matricula=matricula,
            nome=nome,
            cargo=cargo,
            cpf=cpf,
            senha_hash=hash_password(senha_gerada),
            ativo=True,
            primeiro_acesso=True,
            cadastrado_por=gestor_id
        )
        db.add(colaborador)
        matricula_counter += 1
        colaboradores_criados += 1

    db.commit()
    print(f"{colaboradores_criados} colaboradores criados a partir dos motoristas")


def vincular_colaboradores_veiculos(db, caminho_excel: str):
    if not os.path.exists(caminho_excel):
        return

    df = pd.read_excel(caminho_excel, sheet_name="Base_Frota")

    vinculos_realizados = 0

    for _, row in df.iterrows():
        motorista_nome = str(row['MOTORISTA']).strip() if pd.notna(row.get('MOTORISTA')) else None
        cpf_motorista = str(row['CPF MOTORISTA']).strip() if pd.notna(row.get('CPF MOTORISTA')) else None
        placa = str(row['PLACA']).strip() if pd.notna(row.get('PLACA')) else None

        if not cpf_motorista or not placa:
            continue
        veiculo = db.query(Veiculo).filter(Veiculo.placa == placa).first()
        if not veiculo:
            continue
        colaborador = db.query(Colaborador).filter(Colaborador.cpf == cpf_motorista).first()
        if not colaborador:
            continue

        # Vincular colaborador ao veículo
        colaborador.veiculo_id = veiculo.id
        db.commit()
        vinculos_realizados += 1

    print(f"{vinculos_realizados} colaboradores vinculados aos veículos")


def vincular_responsaveis_manutencao(db, caminho_excel: str):
    if not os.path.exists(caminho_excel):
        return

    df = pd.read_excel(caminho_excel, sheet_name="Base_Frota")
    vinculados = 0

    for _, row in df.iterrows():
        placa = str(row['PLACA']).strip() if pd.notna(row.get('PLACA')) else None
        resp_nome = str(row.get('RESPONSÁVEL MANUTENÇÃO', '')).strip() if pd.notna(row.get('RESPONSÁVEL MANUTENÇÃO')) else None

        if not placa or not resp_nome:
            continue

        veiculo = db.query(Veiculo).filter(Veiculo.placa == placa).first()
        if not veiculo:
            continue

        responsavel = db.query(ResponsavelManutencao).filter(ResponsavelManutencao.nome == resp_nome).first()
        if not responsavel:
            responsavel = ResponsavelManutencao(nome=resp_nome)
            db.add(responsavel)
            db.flush()

        veiculo.responsavel_manutencao_id = responsavel.id
        vinculados += 1

    db.commit()
    print(f"{vinculados} responsáveis de manutenção vinculados aos veículos")


if __name__ == "__main__":
    caminho_excel = sys.argv[1] if len(sys.argv) > 1 else "../Teste_Analista_de_Sistemas.xlsx"

    criar_tabelas()
    db = SessionLocal()
    try:
        gestor = criar_gestor_raiz(db)
        importar_frota(db, caminho_excel)
        criar_colaboradores_motoristas(db, caminho_excel, gestor.id)
        vincular_colaboradores_veiculos(db, caminho_excel)
        vincular_responsaveis_manutencao(db, caminho_excel)

        total_colab = db.query(Colaborador).count()
        total_veic = db.query(Veiculo).count()
        ano = datetime.now().year

        print("\n" + "=" * 50)
        print("  SEED CONCLUÍDO — Sistema pronto para uso!")
        print("=" * 50)
        print(f"\n  Veículos importados: {total_veic}")
        print(f"  Colaboradores criados: {total_colab}")
        print(f"\n  Credenciais de acesso:")
        print(f"  ┌────────────┬───────────┬──────────────┐")
        print(f"  │ Perfil     │ Matrícula │ Senha        │")
        print(f"  ├────────────┼───────────┼──────────────┤")
        print(f"  │ Gestor     │ {settings.GESTOR_MATRICULA:<9} │ {settings.GESTOR_SENHA:<12} │")
        print(f"  │ Colaborador│ C0001     │ C0001@{ano}  │")
        print(f"  │ Colaborador│ C0002     │ C0002@{ano}  │")
        print(f"  │ ...        │ C00XX     │ C00XX@{ano}  │")
        print(f"  └────────────┴───────────┴──────────────┘")
        print(f"\n  Todos os colaboradores devem trocar a")
        print(f"  senha no primeiro login.\n")
    finally:
        db.close()