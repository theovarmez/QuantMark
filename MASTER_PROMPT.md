# MASTER PROMPT — QuantMark

> Pega este documento completo como prompt inicial a tu agente de código (Claude Code, Cursor, etc). Contiene visión, arquitectura, modelo de datos y specs de endpoints para construir el MVP de punta a punta.

## 1. Qué es QuantMark

QuantMark es una API SaaS que permite a empresas fintech que usan modelos de IA para trading **marcar (watermark) sus modelos** con un ID único por cliente, registrar cada movimiento/inferencia del modelo, y **detectar cuando ese modelo (o una destilación de él) aparece operando en otro lado sin autorización**.

No es un producto de ML pesado. Es una capa de **registro + huella + detección**. El "watermark" no vive dentro del modelo de IA (eso lo hace el cliente con sus propias técnicas), QuantMark es el sistema que:
1. Genera y administra los IDs únicos de watermark por empresa/modelo.
2. Registra los movimientos/outputs que el cliente le reporta como "generados con este ID".
3. Permite reportar un ID sospechoso encontrado "en la calle" (en otro sistema, dataset filtrado, modelo competidor, etc).
4. Cruza esa data para dar evidencia de robo/destilación que el cliente pueda usar para actuar legalmente.

## 2. Problema que resuelve

Empresas fintech entrenan o afinan modelos de IA propios para trading algorítmico. Son costosos de desarrollar. Si el modelo es robado, filtrado, o **destilado** (alguien lo usa para entrenar un modelo propio copiando su comportamiento), la empresa pierde ventaja competitiva y no tiene forma fácil de probarlo.

## 3. Solución

Sistema de watermarking por ID serial único:
- Cada empresa registra uno o más modelos en QuantMark → recibe un **watermark_id** único (UUID + checksum).
- El cliente inyecta ese ID como parte de su pipeline de trading (ej: metadata en outputs, patrón estadístico en decisiones marginales, seed determinístico en escenarios de baja probabilidad, etc — la técnica de inyección la decide el cliente, QuantMark solo administra el ciclo de vida del ID).
- Cada vez que el modelo "se mueve" (se despliega, se usa, se exporta) el cliente hace `POST` a QuantMark para dejar log del movimiento.
- Si el cliente encuentra evidencia de que su watermark_id aparece en un sistema/dataset/modelo que no es suyo, hace `POST /report` → QuantMark guarda el reporte con timestamp, evidencia y genera un **certificado de detección** (con fecha, hash de evidencia) que sirve como prueba con validez probatoria para una demanda.

## 4. Alcance del MVP (lo que se construye ahora)

Fuera de alcance para v1: no se construye el módulo de inyección de watermark dentro de modelos de IA (eso es técnica propia del cliente o un producto futuro). v1 = **API de gestión de IDs + logs + reportes + certificado**.

## 5. Stack técnico sugerido

- **Backend:** Python + FastAPI (rápido de prototipar, buena doc automática con OpenAPI)
- **DB:** PostgreSQL (Supabase o Neon para no manejar infra)
- **Auth:** API Keys por empresa (header `X-API-Key`), hasheadas en DB
- **Deploy:** Railway o Render (deploy directo desde GitHub, cero DevOps)
- **Storage de evidencia (reportes):** S3-compatible (puede ser Supabase Storage) para adjuntos
- **Certificados:** generación de PDF simple (librería `reportlab` o `weasyprint`) con hash SHA-256 del reporte para integridad

## 6. Modelo de datos

```
companies
  id (uuid, pk)
  name
  email
  api_key_hash
  created_at

models
  id (uuid, pk)
  company_id (fk -> companies.id)
  name                 # ej "trading-alpha-v3"
  description
  created_at

watermark_ids
  id (uuid, pk)                    # este es el "watermark_id" que el cliente inyecta
  model_id (fk -> models.id)
  serial_code (string, unique)     # legible, ej QM-8F2A-91C0
  status (enum: active, revoked)
  created_at

movements
  id (uuid, pk)
  watermark_id (fk -> watermark_ids.id)
  event_type (string)              # deploy, inference, export, retrain...
  metadata (jsonb)                 # libre, lo que el cliente quiera loggear
  created_at

reports
  id (uuid, pk)
  watermark_id (fk -> watermark_ids.id)
  reported_by (fk -> companies.id)
  description (text)               # dónde/cómo se encontró
  evidence_url (string, nullable)  # link a archivo en storage
  evidence_hash (string)           # sha256 de la evidencia
  certificate_url (string)         # PDF generado
  created_at
```

## 7. Endpoints (v1)

Todos requieren `X-API-Key` salvo `/auth/register`.

### Auth
```
POST /auth/register          → crea company, devuelve api_key (una sola vez)
```

### Modelos
```
POST /models                 → registra un modelo nuevo
GET  /models                 → lista modelos de la empresa autenticada
```

### Watermark IDs (mapea a "POST IDs / GET ID / QUERY IDs" del diagrama)
```
POST /ids                    → genera un watermark_id nuevo para un model_id
GET  /ids/{watermark_id}     → detalle de un ID (serial, status, historial resumido)
GET  /ids?model_id=&status=  → query/listado con filtros
PATCH /ids/{watermark_id}    → revocar un ID (status=revoked)
```

### Movimientos
```
POST /ids/{watermark_id}/movements   → registra un movimiento del modelo
GET  /ids/{watermark_id}/movements   → historial de movimientos
```

### Reportes (mapea a "POST REPORT ID")
```
POST /ids/{watermark_id}/report      → reporta detección sospechosa, genera certificado
GET  /reports/{report_id}            → detalle + link al certificado PDF
GET  /reports?watermark_id=          → listado de reportes por ID
```

## 8. Reglas de negocio clave

- Un `watermark_id` solo puede pertenecer a un `model_id`, pero un modelo puede tener varios IDs (rotación).
- Al revocar un ID, sigue siendo consultable (histórico) pero no acepta nuevos movimientos.
- Todo `report` es inmutable una vez creado (append-only) — es evidencia, no se edita.
- El certificado PDF debe incluir: serial_code, empresa dueña, fecha de reporte, descripción, hash de evidencia, y un hash del propio documento (para que no se pueda alterar después sin detectarse).
- Rate limit básico por API key (ej 100 req/min) para evitar abuso.

## 9. Prioridad de construcción (orden sugerido para el agente)

1. Setup FastAPI + Postgres + modelos SQLAlchemy/Alembic con las tablas de arriba.
2. Auth: registro de empresa + generación/verificación de API key.
3. CRUD de `models`.
4. CRUD de `watermark_ids` (incluye generación de serial_code legible tipo `QM-XXXX-XXXX`).
5. Endpoint de `movements`.
6. Endpoint de `reports` + generación de certificado PDF + hash.
7. Documentación automática vía OpenAPI/Swagger (FastAPI la da gratis, solo cuidar buenos `response_model` y descripciones).
8. Deploy a Railway/Render con variables de entorno para DB URL y storage.
9. (Opcional v1.1) Dashboard mínimo (Next.js o incluso solo Swagger UI) para que el dueño de la fintech vea sus IDs sin usar Postman.

## 10. Fuera de alcance explícito (para no meterse en scope creep)

- No se implementa la técnica de watermarking dentro del modelo de IA en sí.
- No hay ML/detección automática de plagio de modelos — la detección la hace el cliente y la reporta.
- No hay facturación/billing en v1.
- No hay multi-usuario por empresa en v1 (1 API key = 1 empresa).
