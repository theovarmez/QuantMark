# QuantMark — Escáner de Watermarks (versión producción)

Versión en producción, on-demand y serverless de la funcionalidad de detección
de fugas del proyecto **QuantMark** (repositorio original:
https://github.com/Ddm140207/QuantMark), construida para el Trabajo Grupal #2
de Programación Web (BCD 2202).

## Integrantes

- Diego Diaz Montero
- Daniel Gamboa
- Cristian [agregar apellido]

## Problema que resuelve

Las fintechs que entrenan modelos de IA propios para trading no tienen forma
fácil de saber si su modelo fue robado, filtrado o copiado por un tercero.
Este producto permite buscar el identificador único (watermark ID) de un
modelo — o cualquier término — en fuentes públicas externas, para detectar
si ese identificador "aparece" en un lugar donde no debería estar.

## API externa utilizada

Esta versión mantiene la misma idea y lógica del prototipo de la actividad
en clase, pero convierte el escaneo de un **daemon en loop** (que corría
cada N horas) a una consulta **on-demand**: se dispara solo cuando el
usuario da clic en "Buscar".

APIs externas consumidas en tiempo real:

- **GitHub Code Search API** (`api.github.com/search/code`) — gratuita,
  funciona sin token (con límite bajo de requests/min) o con un token
  personal para más cuota.
- **Hugging Face Hub API** (`huggingface.co/api/models|datasets|spaces`) —
  gratuita, sin necesidad de token para búsquedas públicas.

## Tecnologías utilizadas

| Capa | Tecnología |
|---|---|
| Frontend | HTML + CSS + JavaScript vanilla (sin build step) |
| Backend | Funciones serverless Python (Vercel Python Runtime) |
| Base de datos | Supabase (PostgreSQL gestionado) vía API REST (PostgREST) |
| Despliegue | Vercel |

## Link de producción

- App desplegada en Vercel: `[completar con el link una vez desplegado]`
- Demo original (Cloud Run, prototipo completo de la actividad en clase):
  https://quantmark-288885439535.us-central1.run.app

## Cómo ejecutar localmente

```bash
# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Instalar Vercel CLI (si no la tienes)
npm install -g vercel

# 3. Copiar variables de entorno de ejemplo y completarlas
cp .env.example .env.local

# 4. Levantar en local (simula el entorno de Vercel, incluyendo /api)
vercel dev
```

Abrir `http://localhost:3000`.

## Variables de entorno necesarias

Ver `.env.example`. Ninguna se sube al repositorio con valores reales;
se configuran en el dashboard de Vercel (Project Settings > Environment
Variables):

- `SUPABASE_URL` — URL del proyecto Supabase.
- `SUPABASE_SERVICE_KEY` — service role key de Supabase (solo se usa en el
  backend, nunca llega al navegador del usuario).
- `GITHUB_TOKEN` — opcional, aumenta el límite de requests a GitHub.
- `HUGGINGFACE_TOKEN` — opcional.

## Uso de Supabase

Se usa Supabase únicamente para **guardar el historial de búsquedas**
(no se necesita autenticación de usuarios para este alcance).

- **Tabla creada:** `search_history` (ver `supabase_schema.sql`)
  - `id` (uuid, PK)
  - `query` (texto buscado)
  - `results_count` (cantidad de resultados encontrados)
  - `sources` (jsonb con el conteo por fuente: GitHub / Hugging Face)
  - `created_at` (timestamp)
- **Cómo se conecta:** las funciones serverless (`api/scan.py`,
  `api/history.py`) llaman directamente a la API REST de Supabase
  (PostgREST) con `requests`, autenticándose con la `service_role key`
  vía header `Authorization: Bearer`. No se usa el SDK de Supabase para
  mantener la función liviana.
- **Seguridad aplicada:** Row Level Security (RLS) está activado en la
  tabla y **no se crean policies** para los roles públicos (`anon` /
  `authenticated`). Esto significa que nadie puede leer o escribir en la
  tabla desde el navegador ni con la clave pública (`anon key`); solo el
  backend, usando la `service_role key` (que nunca se expone al
  frontend), puede hacerlo.

## Buenas prácticas de DevOps aplicadas

- Repositorio en GitHub como fuente única de verdad.
- Despliegue automático: cada push a la rama principal dispara un build
  y deploy en Vercel.
- Separación de ambientes: `.env.local` para desarrollo local,
  variables de entorno del dashboard de Vercel para producción.
- Sin credenciales ni tokens escritos en el código: todo vía
  `os.environ.get(...)`.
- `README.md` documentando instalación, ejecución y variables requeridas.

## Buenas prácticas de SecOps aplicadas

- Ninguna API key, token o credencial está en el repositorio (`.env*`
  con valores reales están en `.gitignore`).
- La `service_role key` de Supabase solo vive en variables de entorno
  del backend serverless, nunca se envía al frontend.
- RLS activo en Supabase sin policies públicas: acceso de escritura/lectura
  restringido exclusivamente al backend.
- Manejo de errores de conexión con las APIs externas: si GitHub o
  Hugging Face no responden, la función devuelve un mensaje genérico
  (`"No se pudo conectar..."`) en vez de exponer trazas técnicas o
  detalles internos al usuario.
- Validación básica de entrada: se rechaza una búsqueda vacía o
  excesivamente larga (>120 caracteres) antes de consultar las APIs
  externas.
