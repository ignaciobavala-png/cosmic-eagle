-- Contenidos: articulos editables desde /admin/contenidos y publicados en
-- /contenidos y /contenidos/[slug].
--
-- Por que una tabla y no constantes tipadas (docs/CONTENT_MAP.md decia que 20
-- recursos no justificaban CRUD): el pedido es que Estela y Sofia carguen texto
-- e imagen **sin tocar codigo**, igual que en Multimedia. `site_content` no
-- sirve para esto: ahi el codigo declara cuantos slots hay, y aca la cantidad de
-- articulos la decide la clienta.
--
-- La portada NO tiene bucket propio: va a `site-assets`, bajo el prefijo
-- `articles/`. Es contenido editable del sitio, el mismo criterio de RLS
-- (escritura solo admin, lectura por URL publica) y un bucket menos que auditar.

create type public.article_category as enum ('biblioteca', 'ciencia', 'testimonios');
create type public.article_status as enum ('draft', 'published');

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  -- El slug es la URL publica: /contenidos/<slug>. Se normaliza en el server y
  -- el CHECK es la ultima linea de defensa contra una key con espacios o barras.
  slug text not null unique,
  title text not null,
  -- Bajada corta: es lo que se lee en la tarjeta del listado.
  excerpt text,
  -- Texto largo en texto plano. Los parrafos se separan con linea en blanco y
  -- una linea que arranca con "## " es subtitulo (ver src/lib/article-body.ts).
  body text not null,
  cover_url text,
  category public.article_category not null default 'biblioteca',
  status public.article_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint articles_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint articles_title_not_blank check (btrim(title) <> ''),
  constraint articles_body_not_blank check (btrim(body) <> '')
);

-- El listado publico ordena por fecha de publicacion dentro de los publicados.
create index articles_published_idx
  on public.articles (status, published_at desc nulls last);

alter table public.articles enable row level security;

-- Lectura publica SOLO de lo publicado. A diferencia de `trips` (donde la
-- policy deja leer los borradores y el filtro lo hace la pagina), aca el
-- borrador no sale de la base: un articulo a medio escribir no se filtra por
-- una ruta nueva que se olvide de filtrar.
create policy articles_select_published on public.articles
  for select
  to anon, authenticated
  using (status = 'published');

-- El admin ve todo, incluidos los borradores, para poder editarlos.
create policy articles_select_admin on public.articles
  for select
  to authenticated
  using ((select private.is_admin()));

create policy articles_insert_admin on public.articles
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy articles_update_admin on public.articles
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy articles_delete_admin on public.articles
  for delete
  to authenticated
  using ((select private.is_admin()));

-- Grants por columna. El `revoke` a nivel tabla va PRIMERO: sin eso el grant por
-- columna no hace nada (ver 20260731210000_fix_profiles_is_admin_grant.sql).
-- `published_at`, `updated_at` y `updated_by` los escribe el trigger.
revoke insert, update on public.articles from authenticated;
grant insert (slug, title, excerpt, body, cover_url, category, status)
  on public.articles to authenticated;
grant update (slug, title, excerpt, body, cover_url, category, status)
  on public.articles to authenticated;

-- `published_at` se sella la primera vez que el articulo pasa a publicado y no
-- se vuelve a tocar: es la fecha que muestra el sitio, y editar un texto viejo
-- no deberia mandarlo arriba de todo en el listado. Volver a borrador y
-- republicar tampoco la cambia.
create or replace function private.touch_article()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  return new;
end;
$$;

create trigger articles_touch
  before insert or update on public.articles
  for each row
  execute function private.touch_article();
