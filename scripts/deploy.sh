#!/usr/bin/env bash
# scripts/deploy.sh
# Roda DENTRO do servidor, na pasta do projeto.
# Uso manual:   bash scripts/deploy.sh
# Uso via CI:   chamado automaticamente pelo GitHub Actions (.github/workflows/deploy.yml)

set -euo pipefail

echo "==> Indo para a pasta do projeto"
cd "$(dirname "$0")/.."

echo "==> Buscando código novo do GitHub"
git fetch origin main
git reset --hard origin/main
# 'reset --hard' garante que o servidor fique EXATAMENTE igual ao GitHub,
# evitando o problema clássico do FileZilla de "esqueci de subir um arquivo".

echo "==> Conferindo se o .env existe (nunca é versionado no Git)"
if [ ! -f .env ]; then
  echo "ERRO: .env não encontrado no servidor. Copie o .env.example e preencha antes de continuar."
  exit 1
fi

echo "==> Subindo containers com o build mais recente"
docker compose pull --ignore-pull-failures || true
docker compose up -d --build

echo "==> Rodando migrations do banco"
docker compose exec -T app npm run prisma:deploy

echo "==> Limpando imagens antigas do Docker (libera espaço em disco)"
docker image prune -f

echo "==> Deploy concluído: $(date)"
