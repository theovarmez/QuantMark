#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${1:?Usage: deploy.sh <project-id> [region]}"
REGION="${2:-us-central1}"
SERVICE_NAME="quantmark-api"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/quantmark"

echo "=== Desplegando QuantMark a Cloud Run ==="
echo "  Project:  ${PROJECT_ID}"
echo "  Region:   ${REGION}"
echo "  Service:  ${SERVICE_NAME}"
echo ""

echo "1/3 Construyendo imagen..."
gcloud builds submit \
  --project "${PROJECT_ID}" \
  --config cloudbuild.yaml \
  --substitutions "_REGION=${REGION},_DATABASE_URL=${DATABASE_URL:-},_SECRET_KEY=${SECRET_KEY:-}" \
  --timeout=15m

echo "2/3 Desplegando a Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --image "${IMAGE}" \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80 \
  --timeout 300 \
  --set-env-vars "ENVIRONMENT=production,STORAGE_BACKEND=gcs,GCS_BUCKET=quantmark-certificates"

echo ""
echo "=== Despliegue completado ==="
echo "Para vincular Firebase Hosting:"
echo "  firebase use ${PROJECT_ID}"
echo "  firebase deploy --only hosting"
