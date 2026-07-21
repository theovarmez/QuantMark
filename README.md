# QuantMark

API SaaS para watermarking de modelos de IA de trading. Permite a fintechs registrar, trackear y detectar uso no autorizado de sus modelos.

## Stack

| Capa | Tecnología |
|------|-----------|
| API | Python 3.12 + FastAPI |
| DB | PostgreSQL 16 (async via asyncpg) |
| Auth | API Key hasheada con bcrypt |
| Logs | structlog (JSON en producción) |
| Storage | Google Cloud Storage / S3 / local |
| Deploy | Cloud Run + Firebase Hosting |

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/register` | ❌ | Registrar empresa (devuelve API Key) |
| POST | `/models` | ✅ | Registrar modelo |
| GET | `/models` | ✅ | Listar modelos |
| POST | `/ids` | ✅ | Generar watermark ID |
| GET | `/ids` | ✅ | Listar watermark IDs |
| GET | `/ids/{id}` | ✅ | Detalle de watermark ID |
| PATCH | `/ids/{id}` | ✅ | Revocar watermark ID |
| POST | `/ids/{id}/movements` | ✅ | Registrar movimiento |
| GET | `/ids/{id}/movements` | ✅ | Historial de movimientos |
| POST | `/ids/{id}/report` | ✅ | Reportar uso sospechoso |
| GET | `/reports/{id}` | ❌ | Ver reporte + certificado |
| GET | `/reports` | ❌ | Listar reportes |

## Desarrollo local

```bash
pip install -e ".[dev]"

# Inicia PostgreSQL + API
docker compose up -d

# Docs: http://localhost:8000/docs
```

## Deploy a Cloud Run

```bash
# 1. Autenticarse en GCP
gcloud auth login
gcloud config set project <tu-project-id>

# 2. Desplegar
chmod +x deploy.sh
./deploy.sh <tu-project-id> us-central1

# 3. (Opcional) Firebase Hosting como CDN
firebase use <tu-project-id>
firebase deploy --only hosting
```

### Cloud Build (CI/CD)

El archivo `cloudbuild.yaml` automatiza: build → push a Artifact Registry → deploy a Cloud Run.

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions _REGION=us-central1,_DATABASE_URL=...,_SECRET_KEY=...
```

### Variables de entorno requeridas en Cloud Run

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Conexión a PostgreSQL (asyncpg) |
| `SECRET_KEY` | Clave secreta para la app |
| `ENVIRONMENT` | `production` |
| `STORAGE_BACKEND` | `gcs` (recomendado) o `s3` |
| `GCS_BUCKET` | Bucket de GCS para certificados |
| `CORS_ORIGINS` | Dominios permitidos separados por coma |

## Firebase Hosting + Cloud Run

`firebase.json` reescribe todas las rutas `/api/*`, `/docs`, `/health` a Cloud Run.
Las rutas no coincidentes sirven `index.html` (landing page estática).

```bash
firebase deploy --only hosting
```

## Modelo de datos

```
companies 1──N models 1──N watermark_ids 1──N movements
                                         └──N reports
```

## Reglas de negocio

- 1 watermark ID → 1 modelo (1 modelo puede tener N IDs)
- IDs revocados son consultables pero no aceptan movimientos
- Reportes son append-only (inmutables, valor probatorio)
- Certificado PDF incluye hash SHA-256 del documento para integridad
