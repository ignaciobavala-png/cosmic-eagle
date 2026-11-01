-- Conversaciones del asistente de IA (/admin/ia y la burbuja del panel).
-- Cada admin ve SOLO las suyas. El contenido son los mensajes de la interfaz
-- (UIMessage[]), incluidos los resultados de herramientas: se restauran tal cual
-- para retomar una charla, y son el registro de lo que se pidio y se aprobo.
-- Las escribe el servidor al terminar cada turno; la persona puede borrarlas.

create table public.ai_conversations (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Conversación',
  page text,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_conversations_user_updated_idx
  on public.ai_conversations (user_id, updated_at desc);

alter table public.ai_conversations enable row level security;

create policy "admin lee sus conversaciones"
  on public.ai_conversations for select to authenticated
  using (private.is_admin() and user_id = auth.uid());

create policy "admin crea sus conversaciones"
  on public.ai_conversations for insert to authenticated
  with check (private.is_admin() and user_id = auth.uid());

create policy "admin actualiza sus conversaciones"
  on public.ai_conversations for update to authenticated
  using (private.is_admin() and user_id = auth.uid())
  with check (private.is_admin() and user_id = auth.uid());

create policy "admin borra sus conversaciones"
  on public.ai_conversations for delete to authenticated
  using (private.is_admin() and user_id = auth.uid());

-- Revoke a nivel de tabla y grant de columnas: `user_id` no se reescribe nunca.
revoke all on public.ai_conversations from anon, authenticated;
grant select, insert, delete on public.ai_conversations to authenticated;
grant update (title, page, messages, updated_at) on public.ai_conversations to authenticated;
