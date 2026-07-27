#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${1:?Usage: deploy.sh <project-id> [region]}"
REGION="${2:-us-central1}"

echo "=== QuantMark → Cloud Run ==="
echo "  Project: ${PROJECT_ID}"
echo "  Region:  ${REGION}"
echo "  DB:      SQLite (auto)"
echo "  Storage: local"
echo ""

echo "Building + deploying..."
gcloud builds submit \
  --project "${PROJECT_ID}" \
  --config cloudbuild.yaml \
  --substitutions "_REGION=${REGION},_SECRET_KEY=$(openssl rand -hex 32)" \
  --timeout=15m

echo ""
echo "Done! Verifica en:"
echo "  https://console.cloud.google.com/run?project=${PROJECT_ID}"
