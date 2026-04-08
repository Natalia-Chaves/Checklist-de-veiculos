#!/usr/bin/env bash
set -e

# Instalar dependências do backend
cd backend
pip install -r requirements.txt

# Build do frontend React
cd ../frontend
npm install
npm run build

# Copiar build para backend/static
cp -r build ../backend/static

# Criar tabelas, gestor e importar dados do Excel
cd ../backend
python seed.py ../Teste_Analista_de_Sistemas.xlsx
