-- Auditoria del agente de IA del panel (/admin/ia).
-- Cada llamada a una herramienta deja una fila: que se consulto o se cambio, con
-- que argumentos y cuantas filas volvieron. Es el registro de lo que el modelo
-- vio (los datos salen a DeepSeek) y, desde la etapa de escrituras, de lo que hizo.
-- Solo admin lee; el log es inmutable (sin UPDATE ni DELETE para el panel).

create table public.ai_agent_log (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  conversation_id text,
  kind text not null check (kind in ('read', 'write')),
  tool text not null,
  args jsonb not null default '{}'::jsonb,
  rows_returned integer,
  error text,
  created_at timestamptz not null default now()
);

create index ai_agent_log_created_idx on public.ai_agent_log (created_at desc);

alter table public.ai_agent_log enable row level security;

create policy "admin lee el log del agente"
  on public.ai_agent_log for select to authenticated
  using (private.is_admin());

-- El `user_id` tiene que ser el de quien escribe: un admin no firma por otro.
create policy "admin registra sus propias llamadas"
  on public.ai_agent_log for insert to authenticated
  with check (private.is_admin() and user_id = auth.uid());

revoke all on public.ai_agent_log from anon, authenticated;
grant select, insert on public.ai_agent_log to authenticated;
