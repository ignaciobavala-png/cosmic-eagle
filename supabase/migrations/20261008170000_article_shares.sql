-- Links para compartir un contenido (pedido de la organizacion, 08/10): el
-- admin genera un link y quien lo recibe lee el contenido entero, sin cuenta y
-- sin importar el nivel ni si esta publicado.
--
-- **El token vive en su propia tabla y no en `articles`**: `articles` la lee
-- `anon` para todo lo publico, y una columna mas ahi se filtraria con el resto
-- de la fila. Aca solo entra el admin.
--
-- Un link por contenido. "Dejar de compartir" borra la fila y el link muere en
-- el acto: la pagina compartida es dinamica, no hay cache que lo sostenga.
create table public.article_shares (
  article_id uuid primary key references public.articles (id) on delete cascade,
  -- 122 bits al azar: no se adivina. Sin guiones, para que el link sea uno solo.
  token text not null unique
    default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null
);

alter table public.article_shares enable row level security;

create policy article_shares_admin on public.article_shares
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Supabase le da todo a `anon` y `authenticated` sobre una tabla nueva.
revoke all on public.article_shares from anon, authenticated;
grant select, insert, delete on public.article_shares to authenticated;

-- La lectura por token. `security definer` porque quien abre el link no puede
-- leer ni `article_shares` ni (si es de `programa` o un borrador) el articulo.
-- Devuelve solo lo que se muestra; nunca el token ni nada del autor.
create or replace function public.shared_article(p_token text)
returns table (
  title text,
  title_en text,
  excerpt text,
  excerpt_en text,
  body text,
  body_en text,
  cover_url text,
  audio_url text,
  category public.article_category
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.title, a.title_en, a.excerpt, a.excerpt_en, a.body, a.body_en,
         a.cover_url, a.audio_url, a.category
  from public.article_shares s
  join public.articles a on a.id = s.article_id
  where s.token = p_token;
$$;

revoke all on function public.shared_article(text) from public;
grant execute on function public.shared_article(text) to anon, authenticated;
