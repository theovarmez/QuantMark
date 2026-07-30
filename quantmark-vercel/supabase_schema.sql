-- Ejecutar en Supabase > SQL Editor

create table if not exists search_history (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  results_count int not null default 0,
  sources jsonb,
  created_at timestamptz not null default now()
);

-- Row Level Security: bloqueamos acceso público directo.
-- Solo la función serverless (con la service_role key) puede escribir/leer.
alter table search_history enable row level security;

-- No se crean policies para anon/authenticated a propósito:
-- sin policies + RLS activo = nadie puede acceder vía la anon key,
-- solo el backend con la service_role key (que ignora RLS).
