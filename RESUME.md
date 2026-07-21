# RESUME — Frontend QuantMark

> Todo lo necesario para construir un mini frontend moderno, dark-tech-vibes para la API QuantMark.

---

## 1. Stack técnico sugerido

| Capa | Opción recomendada |
|------|-------------------|
| Framework | **React 18+** (con Vite) o **Next.js** (si quieres SSR/SSG) |
| Lenguaje | TypeScript estricto |
| Estilos | **Tailwind CSS v4** + plugin `tailwindcss-animate` + `clsx` |
| Iconos | **Lucide React** o **Phosphor Icons** |
| Estado global | TanStack Query (React Query) para server state |
| HTTP client | **ky** o **axios** (con interceptor de API Key) |
| Router | React Router v7 o TanStack Router |
| Charts (opcional) | Recharts o Tremor |
| Formularios | React Hook Form + Zod |
| Animaciones | Framer Motion |

### Dark-tech vibes — librerías UI

- **shadcn/ui** (componentes base con Tailwind, dark mode nativo)
- O bien, **radix-ui** + Tailwind desde cero para más control visual

---

## 2. Tema visual — "Dark Tech"

```css
/* Paleta base */
--background: #0a0a0f
--surface:     #12121a
--surface-2:   #1a1a2e
--border:      #2a2a3e
--text:        #e4e4ec
--text-muted:  #8888a0

/* Acentos (neón/tech) */
--accent-cyan:    #00e5ff
--accent-green:   #00ff88
--accent-purple:  #a855f7
--accent-amber:   #fbbf24
--accent-red:     #ff4466

/* Tipografía */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace
--font-sans: 'Inter', 'Plus Jakarta Sans', system-ui, sans-serif
```

**Vibes:** fondo casi negro, glassmorphism sutil, bordes finos con glow, tipografía mono para datos técnicos, transiciones suaves, grid sutil de fondo estilo "matrix light".

---

## 3. Páginas / Rutas

| Ruta | Página | API calls |
|------|--------|-----------|
| `/` | Landing page (hero + features + CTA) | Ninguno |
| `/register` | Registro de empresa | `POST /auth/register` |
| `/login` | Ingresar API Key (guardar en localStorage) | — |
| `/dashboard` | Dashboard con stats globales | `GET /models`, `GET /ids`, `GET /reports` |
| `/models` | Listar + crear modelos | `GET /models`, `POST /models` |
| `/ids` | Listar watermark IDs con filtros | `GET /ids?model_id=&status=` |
| `/ids/new` | Crear watermark ID para un modelo | `POST /ids` |
| `/ids/:id` | Detalle de un ID (info + movimientos + reportes) | `GET /ids/:id`, `GET /ids/:id/movements`, `GET /reports?watermark_id=` |
| `/ids/:id/movements/new` | Registrar movimiento | `POST /ids/:id/movements` |
| `/ids/:id/report` | Reportar uso sospechoso | `POST /ids/:id/report` |
| `/reports` | Listado de reportes | `GET /reports` |
| `/reports/:id` | Detalle del reporte + enlace al certificado PDF | `GET /reports/:id` |

---

## 4. Componentes UI necesarios

### Layout
- `AppShell` — sidebar colapsable + header + main content
- `Sidebar` — navegación con iconos, active states, tooltips
- `TopBar` — logo + API key status badge + theme toggle

### Data display
- `DataTable` — tabla ordenable, filtrable, responsive
- `StatCard` — tarjeta con métrica (título, valor, trend, icono)
- `Badge` — status (active = verde, revoked = ámbar)
- `SerialCode` — componente con copy-to-clipboard y estilo mono
- `Timeline` — para movimientos (event_type + metadata + timestamp)
- `CertificateLink` — botón/link para descargar/ver PDF

### Forms
- `ApiKeyInput` — input con toggle visibility + copy
- `ModelForm` — nombre + descripción
- `MovementForm` — event_type (select) + metadata (JSON editor o key-value)
- `ReportForm` — description + evidence_url

### Feedback
- `Toast` — notificaciones success/error
- `ConfirmDialog` — para revocar ID
- `EmptyState` — cuando no hay datos
- `LoadingSkeleton` — carga esqueletizada

### Charts (dashboard)
- `ModelChart` — modelos registrados en el tiempo
- `IdsChart` — IDs activos vs revocados
- `MovementsChart` — movimientos por día/semana

---

## 5. Servicios / API Layer

```
src/
  services/
    api.ts              # instancia de ky/axios, interceptor X-API-Key
    auth.ts             # register()
    models.ts           # listModels(), createModel()
    watermarks.ts       # listWatermarks(), createWatermark(), getWatermark(), revokeWatermark()
    movements.ts        # listMovements(), createMovement()
    reports.ts          # createReport(), getReport(), listReports()
```

### Manejo de API Key
- Guardar en `localStorage` con key `qm_api_key`
- Prompt al usuario si no hay key guardada (página de "login")
- Header: `X-API-Key: <key>`

---

## 6. Hooks personalizados

| Hook | Propósito |
|------|-----------|
| `useApiKey()` | Leer/escribir API Key en localStorage |
| `useModels()` | TanStack Query: lista de modelos + refetch |
| `useWatermarks(filters)` | TanStack Query: lista de IDs con filtros |
| `useMovements(id)` | TanStack Query: movimientos de un ID |
| `useReports(watermarkId?)` | TanStack Query: reportes |
| `useStats()` | Agregar counts para dashboard |

---

## 7. Integración con Firebase Hosting

El frontend se despliega en `public/` (ya configurado en `firebase.json`):
- Build output → `public/` (reemplaza el `index.html` actual)
- Firebase Hosting sirve el SPA con fallback a `index.html` para todas las rutas
- Las llamadas `/api/*` se reescriben a Cloud Run (ya configurado)

```bash
# Build
npm run build    # → output a public/

# Deploy
firebase deploy --only hosting
```

---

## 8. Estructura de directorios sugerida

```
quantmark-frontend/
├── public/                  # build output (firebase hosting)
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # AppShell, Sidebar, TopBar
│   │   └── features/        # ModelTable, IdsTimeline, ReportCard...
│   ├── pages/               # una carpeta por ruta
│   │   ├── Landing.tsx
│   │   ├── Register.tsx
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ModelsList.tsx
│   │   ├── IdsList.tsx
│   │   ├── IdDetail.tsx
│   │   ├── NewMovement.tsx
│   │   ├── NewReport.tsx
│   │   ├── ReportsList.tsx
│   │   └── ReportDetail.tsx
│   ├── hooks/               # custom hooks + react-query
│   ├── services/            # API client + endpoints
│   ├── lib/                 # utils, constants, types
│   ├── styles/              # globals.css (Tailwind + theme vars)
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 9. Flujo de autenticación

1. Usuario visita ` /register` → completa formulario → recibe `api_key`
2. Se guarda automáticamente en `localStorage`
3. Redirige a `/dashboard`
4. En visitas siguientes, si hay key en `localStorage` → se usa en `X-API-Key`
5. Si la key es inválida (401) → redirigir a `/login` para ingresar otra
6. `/login` permite pegar una API Key existente

---

## 10. Dependencias (package.json)

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "@tanstack/react-query": "^5.0.0",
    "ky": "^1.7.0",
    "react-hook-form": "^7.0.0",
    "@hookform/resolvers": "^3.0.0",
    "zod": "^3.23.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "lucide-react": "^0.460.0",
    "framer-motion": "^11.0.0",
    "recharts": "^2.0.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

---

## 11. Tips Dark Tech Vibes

- **Fondo animado**: grid SVG sutil + partículas flotantes (opcional, con CSS puro)
- **Glow en bordes**: `box-shadow: 0 0 15px -3px var(--accent-cyan)` en hover
- **Mono para datos**: serial codes, UUIDs, hashes → `font-mono` con tracking-wider
- **Transiciones**: `transition-all duration-300` con ease-out
- **Scrollbar**: personalizada delgada y oscura `::-webkit-scrollbar`
- **Responsive**: sidebar se convierte en bottom nav en mobile
- **Loading**: skeleton con shimmer animado (gradiente móvil)
- **Glass effect**: `backdrop-blur-xl bg-white/[0.03] border border-white/[0.06]`
