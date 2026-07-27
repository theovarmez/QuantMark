#!/usr/bin/env bash
set -euo pipefail

echo "=== QuantMark — Deploy VM (docker compose) ==="
echo ""

echo "1/3 Copiando archivos al servidor..."
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_HOST="${REMOTE_HOST:?Usage: REMOTE_HOST=ip REMOTE_USER=root ./deploy-vm.sh}"
REMOTE_DIR="/opt/quantmark"

ssh ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_DIR}"
scp -r app/ watcher/ scripts/ public/ QM_MAP/ pyproject.toml Dockerfile docker-compose.yml .env* ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

echo "2/3 Instalando Docker + docker compose en el servidor..."
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'REMOTE'
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi
REMOTE

echo "3/3 Levantando servicios..."
ssh ${REMOTE_USER}@${REMOTE_HOST} << REMOTE
cd ${REMOTE_DIR}

# Crear .env de produccion si no existe
if [ ! -f .env.prod ]; then
  cat > .env.prod << 'ENVEOF'
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/quantmark
SECRET_KEY=$(openssl rand -hex 32)
STORAGE_BACKEND=minio
STORAGE_ENDPOINT=http://minio:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=quantmark-evidence
ENVEOF
fi

# Copiar env prod a .env si .env no existe
[ ! -f .env ] && cp .env.prod .env

docker compose --env-file .env.prod up -d --build
REMOTE

echo ""
echo "=== Deploy completado ==="
echo "  API:   http://${REMOTE_HOST}:8000/docs"
echo "  MinIO: http://${REMOTE_HOST}:9001 (minioadmin/minioadmin)"
echo ""
