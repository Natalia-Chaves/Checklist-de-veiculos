# Checklist de Veículos — Gestão de Frota

Sistema web para controle de checklist diário de frota veicular, com perfis diferenciados para **Gestor** e **Colaborador**.

---

## Telas da Aplicação

### Login e Primeiro Acesso

Tela de autenticação com matrícula e senha. No primeiro login, o sistema exige a troca de senha obrigatória.

![Login](docs/screenshots/login.png)

![Primeiro Acesso](docs/screenshots/primeiro-acesso.png)

### Área do Gestor

**Dashboard** — Visão geral com cards de resumo (total de checklists, pendentes, aprovados, reprovados), gráfico semanal e lista de veículos sem checklist no dia.

![Dashboard](docs/screenshots/gestor-dashboard.png)

**Checklists** — Lista de todos os checklists com filtros inline por status, colaborador, veículo e período. Permite abrir o detalhe para aprovar ou reprovar.

![Checklists](docs/screenshots/gestor-checklists.png)

**Detalhe do Checklist** — Exibe todas as informações do checklist: fotos, respostas das perguntas, KM, observações. O gestor aprova ou reprova com justificativa obrigatória.

![Detalhe do Checklist](docs/screenshots/gestor-checklist-detalhe.png)

**Veículos** — Gestão da frota com 30+ campos, filtros inline, modal de edição, visualização de detalhes e histórico de checklists por veículo.

![Veículos](docs/screenshots/gestor-veiculos.png)

**Colaboradores** — CRUD completo de colaboradores com vínculo ao veículo, ativar/desativar, redefinir senha e histórico de redefinições.

![Colaboradores](docs/screenshots/gestor-colaboradores.png)

**Relatórios** — Geração de relatórios sob demanda em Excel e PDF, com filtros por período, colaborador, veículo e status.

![Relatórios](docs/screenshots/gestor-relatorios.png)

**Logs** — Registro completo de atividades do sistema com ação, usuário, IP e data/hora.

![Logs](docs/screenshots/gestor-logs.png)

### Área do Colaborador

**Novo Checklist** — Formulário com upload de 5 fotos obrigatórias, perguntas dinâmicas por tipo de veículo, campo de KM com validação e observações.

![Novo Checklist](docs/screenshots/colaborador-novo-checklist.png)

**Meus Checklists** — Histórico dos checklists enviados com status de aprovação, detalhes e fotos.

![Meus Checklists](docs/screenshots/colaborador-meus-checklists.png)

**Meu Veículo** — Visualização completa dos dados do veículo vinculado ao colaborador.

![Meu Veículo](docs/screenshots/colaborador-meu-veiculo.png)

---

## Stack

| Camada     | Tecnologia                              |
|------------|-----------------------------------------|
| Back-end   | Python 3.12 + FastAPI + SQLAlchemy 2.x  |
| Banco      | SQLite (dev) / PostgreSQL (prod)        |
| Auth       | JWT (access token com roles por perfil) |
| Front-end  | React 18 + Tailwind CSS + Recharts      |
| Ícones     | Lucide React                            |
| Upload     | Armazenamento local em `/uploads`       |
| Relatórios | openpyxl (Excel) + ReportLab (PDF)      |
| Deploy     | Render (Blueprint)                      |

---

## Pré-requisitos

- Python 3.11+
- Node.js 18+
- npm

---

## Instalação local

### 1. Back-end

```bash
cd backend
pip install -r requirements.txt
```

Crie um arquivo `.env` na pasta `backend/` (opcional, veja `.env.example`).

### 2. Seed — criar gestor e importar dados

Com o Excel na raiz do projeto:

```bash
cd backend
python seed.py ../Teste_Analista_de_Sistemas.xlsx
```

Isso cria as tabelas, o gestor padrão, importa os veículos, cria colaboradores a partir dos motoristas e vincula responsáveis de manutenção.

Sem o Excel (apenas gestor + tabelas):

```bash
cd backend
python seed.py
```

### 3. Iniciar o back-end

```bash
cd backend
uvicorn main:app --reload --port 8000
```

API: http://localhost:8000/api  
Swagger: http://localhost:8000/docs

### 4. Front-end

```bash
cd frontend
npm install
npm start
```

App: http://localhost:3000

---

## Acesso inicial

| Perfil       | Matrícula | Senha         |
|-------------|-----------|---------------|
| Gestor      | G0001     | Admin@2024    |
| Colaborador | C0001     | C0001@{ano}   |
| Colaborador | C0002     | C0002@{ano}   |
| ...         | C00XX     | C00XX@{ano}   |

> Colaboradores criados pelo seed recebem senha `{matrícula}@{ano}`. Todos devem trocar a senha no primeiro login.

---

## Funcionalidades

### Área do Colaborador
- Novo checklist com upload de 5 fotos obrigatórias (câmera ou arquivo)
- Perguntas dinâmicas por tipo de veículo
- Validação em tempo real: KM não pode ser inferior ao último registrado
- Histórico dos próprios checklists com status de aprovação
- Visualização completa do veículo vinculado (página Meu Veículo)
- Primeiro acesso obriga troca de senha

#### Perguntas do Checklist

**Perguntas base (todos os veículos):**

| # | Pergunta |
|---|----------|
| 1 | Documentação em dia? |
| 2 | Equipamentos obrigatórios presentes? |
| 3 | Existem avarias visíveis? |
| 4 | O veículo está apto para uso? |
| 5 | Os pneus aparentam condição adequada? |

**Perguntas adicionais por tipo de veículo:**

| # | Carro | Utilitário | Caminhão |
|---|-------|------------|----------|
| 6 | Ar-condicionado funcionando? | Caçamba/compartimento de carga em boas condições? | Tacógrafo funcionando? |
| 7 | Cintos de segurança funcionando e sem rasgos? | Extintor de incêndio dentro da validade? | Luzes e sinalização traseira funcionando? |
| 8 | Estepe em boas condições e calibrado? | Estepe em boas condições e calibrado? | Freio de estacionamento funcionando? |
| 9 | — | — | Lona/corda de amarração em boas condições? |
| 10 | — | — | Extintor de incêndio dentro da validade? |

**Pergunta condicional:** Se o veículo possuir tração 4x4, é adicionada a pergunta *"Sistema de tração 4x4 funcionando?"*.

> **Total de perguntas:** Carro: 8, Utilitário: 8, Caminhão: 10 (+ 1 se tiver tração 4x4)

### Área do Gestor
- Dashboard com cards resumo, gráfico semanal e lista de veículos sem checklist
- Aprovação/reprovação de checklists com justificativa obrigatória
- Gestão de colaboradores: CRUD, ativar/desativar, redefinir senha, histórico de redefinições
- Gestão de veículos com 30+ campos da base original, detalhes e histórico de checklists
- Gestão de responsáveis de manutenção
- Filtros inline estilo Excel em todas as tabelas
- Relatórios sob demanda em Excel e PDF com filtros por período, colaborador, veículo e status
- Logs de atividade com rastreabilidade completa (ação, IP, data/hora)
- Primeiro acesso obriga troca de senha

---

## Endpoints da API

Todas as rotas estão sob o prefixo `/api`. Documentação interativa em `/docs` (Swagger).

### Autenticação

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| POST | `/auth/login` | Autenticar usuário (gestor ou colaborador) | Público |
| POST | `/auth/trocar-senha` | Trocar senha do usuário logado | Autenticado |
| GET | `/auth/me` | Obter dados do usuário autenticado | Autenticado |

### Gestor

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/gestor/perfil` | Obter perfil do gestor |
| PUT | `/gestor/perfil` | Atualizar perfil do gestor |
| GET | `/gestor/colaboradores` | Listar todos os colaboradores |
| POST | `/gestor/colaboradores` | Criar novo colaborador |
| GET | `/gestor/colaboradores/{id}` | Obter detalhes de um colaborador |
| PUT | `/gestor/colaboradores/{id}` | Atualizar dados do colaborador |
| POST | `/gestor/colaboradores/{id}/redefinir-senha` | Redefinir senha de um colaborador |
| GET | `/gestor/colaboradores/{id}/historico-senha` | Histórico de redefinições de senha |
| GET | `/gestor/logs` | Listar logs de atividades do sistema |

### Veículos

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| GET | `/veiculos` | Listar todos os veículos | Gestor |
| POST | `/veiculos` | Cadastrar novo veículo | Gestor |
| GET | `/veiculos/meu-veiculo` | Obter veículo do colaborador logado | Colaborador |
| GET | `/veiculos/{id}` | Obter detalhes de um veículo | Gestor |
| PUT | `/veiculos/{id}` | Atualizar dados do veículo | Gestor |
| GET | `/veiculos/responsaveis/manutencao` | Listar responsáveis de manutenção | Gestor |
| POST | `/veiculos/responsaveis/manutencao` | Cadastrar responsável de manutenção | Gestor |
| PUT | `/veiculos/responsaveis/manutencao/{id}` | Atualizar responsável de manutenção | Gestor |

### Checklists

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| POST | `/checklists` | Enviar novo checklist com fotos | Colaborador |
| GET | `/checklists/meus` | Checklists do colaborador logado | Colaborador |
| GET | `/checklists` | Listar todos os checklists | Gestor |
| GET | `/checklists/dashboard` | Dashboard com resumo | Gestor |
| GET | `/checklists/{id}` | Detalhes de um checklist | Autenticado |
| PATCH | `/checklists/{id}/validar` | Aprovar ou reprovar checklist | Gestor |
| GET | `/checklists/historico/veiculo/{id}` | Histórico de checklists do veículo | Gestor |

### Relatórios

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/relatorio/configuracao` | Obter configuração de relatório |
| PUT | `/relatorio/configuracao` | Atualizar configuração de relatório |
| GET | `/relatorio/excel` | Baixar relatório em Excel |
| GET | `/relatorio/pdf` | Baixar relatório em PDF |

---

## Fluxo do sistema

```
1. Gestor loga → cria colaborador → vincula ao veículo
2. Colaborador loga → troca senha (1º acesso) → acessa formulário
3. Colaborador preenche: data, KM, 5 fotos, perguntas Sim/Não, observação
4. Sistema valida: bloqueia se faltar foto, KM inválido ou veículo inativo
5. Checklist enviado → status "pendente"
6. Gestor acessa dashboard → vê pendentes → abre checklist → aprova ou reprova
7. Aprovação atualiza KM do veículo automaticamente
8. Gestor gera relatório (Excel/PDF) sob demanda com filtros
```

---

## Automações

| # | Automação | Gatilho |
|---|-----------|---------|
| 1 | Bloqueio de envio sem as 5 fotos | Ao enviar o checklist |
| 2 | Bloqueio para veículo inativo | Ao enviar o checklist |
| 3 | Validação de KM (não aceita menor que o atual) | Ao preencher o formulário |
| 4 | Atualização automática do KM do veículo | Ao gestor aprovar o checklist |
| 5 | Status automático (aprovado/reprovado) | Ao gestor validar |
| 6 | Obrigatoriedade de justificativa na reprovação | Ao reprovar checklist |

---

## Estrutura de pastas

```
checklist-veiculos/
├── backend/
│   ├── core/           # config, database, JWT, dependencies
│   ├── models/         # SQLAlchemy models (usuário, veículo, checklist, log)
│   ├── schemas/        # Pydantic schemas
│   ├── routes/         # endpoints FastAPI (auth, gestor, veículos, checklist, relatório)
│   ├── services/       # upload, relatório (Excel/PDF)
│   ├── uploads/        # fotos salvas localmente
│   ├── main.py         # app FastAPI + SPA serving
│   ├── seed.py         # popular banco (gestor + dados do Excel)
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── gestor/       # Dashboard, Checklists, Colaboradores, Veículos, Relatórios, Logs
│       │   └── colaborador/  # NovoChecklist, MeusChecklists, MeuVeiculo
│       ├── components/       # componentes compartilhados (Modal, Badge, StatCard, etc.)
│       ├── context/          # AuthContext (JWT + roles)
│       └── services/         # api.js (axios com interceptors)
├── build.sh            # script de build para Render
├── render.yaml         # Blueprint de deploy (web service + PostgreSQL)
└── .gitignore
```



