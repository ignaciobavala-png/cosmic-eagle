-- "Envio material" (pedido de la organizacion, 28/10): documentos con el
-- formato del cuaderno de preparacion de Egipto (tapa, capitulos a dos
-- columnas, frases destacadas, imagenes banner/perfil/cuadrada).
--
-- El documento se guarda como BLOQUES estructurados (`blocks`, jsonb) y no
-- como HTML ni como PDF: la app los dibuja, asi nadie escribe HTML (no hay
-- sanitizador en el proyecto) y el texto queda limpio para lo que venga despues
-- (publicar en Contenidos, un asistente que lo lea).
--
-- **Solo el admin lee y escribe la tabla.** El link para compartir lleva un
-- token y se lee por la funcion `shared_material`, no por la tabla: por eso el
-- token puede vivir en la misma fila (a diferencia de `article_shares`, donde
-- la tabla padre si la lee `anon`).
create table public.materiales (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  -- La linea chica de la tapa ("Cuaderno de preparacion").
  eyebrow text check (eyebrow is null or char_length(eyebrow) <= 120),
  cover_url text,
  back_cover_url text,
  blocks jsonb not null default '[]'::jsonb
    check (jsonb_typeof(blocks) = 'array'),
  -- Null = no se comparte. 122 bits al azar: no se adivina. Sin guiones, para
  -- que el link sea uno solo.
  share_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null
);

alter table public.materiales enable row level security;

create policy materiales_admin on public.materiales
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Supabase le da todo a `anon` y `authenticated` sobre una tabla nueva.
revoke all on public.materiales from anon, authenticated;
grant select, insert, update, delete on public.materiales to authenticated;

-- La lectura por token. `security definer` porque quien abre el link no puede
-- leer la tabla. Devuelve solo lo que se muestra: nunca el token ni el autor.
create or replace function public.shared_material(p_token text)
returns table (
  title text,
  eyebrow text,
  cover_url text,
  back_cover_url text,
  blocks jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.title, m.eyebrow, m.cover_url, m.back_cover_url, m.blocks
  from public.materiales m
  where p_token is not null and m.share_token = p_token;
$$;

revoke all on function public.shared_material(text) from public;
grant execute on function public.shared_material(text) to anon, authenticated;
