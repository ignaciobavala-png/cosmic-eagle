-- HTML subido (pedido de la organizacion, 29/10): el editor de "Envio material"
-- no les sirvio (no tienen tiempo de armar el documento en el panel). Lo que
-- quieren es subir un HTML ya hecho en su computadora, sacar un link para
-- compartirlo, y poder cargar ese mismo HTML como un contenido de la biblioteca.
--
-- El HTML viaja en una columna de texto y se dibuja SIEMPRE dentro de un
-- <iframe sandbox> sin `allow-same-origin` (ver `HtmlFrame`): no hay sanitizador
-- en el proyecto y asi el script de ese HTML no toca la sesion ni el panel.
--
-- No se borra el editor viejo de `materiales` (`blocks`, tapas): hay documentos
-- cargados. Quedan las columnas; el panel nuevo solo lista los que tienen `html`.

alter table public.materiales add column html text
  check (html is null or char_length(html) <= 4000000);

-- En `articles` el HTML va en `body` (la RLS, el nivel de acceso y los links
-- compartidos siguen funcionando igual); `body_format` dice como dibujarlo.
alter table public.articles add column body_format text not null default 'text'
  check (body_format in ('text', 'html'));

-- La trampa del revoke: `articles` tiene grants por columna.
grant insert (body_format) on public.articles to authenticated;
grant update (body_format) on public.articles to authenticated;

-- Cambia el tipo de retorno: hay que soltar la funcion y crearla de nuevo.
drop function public.shared_article(text);
create function public.shared_article(p_token text)
returns table (
  title text,
  title_en text,
  excerpt text,
  excerpt_en text,
  body text,
  body_en text,
  cover_url text,
  audio_url text,
  category public.article_category,
  body_format text
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.title, a.title_en, a.excerpt, a.excerpt_en, a.body, a.body_en,
         a.cover_url, a.audio_url, a.category, a.body_format
  from public.article_shares s
  join public.articles a on a.id = s.article_id
  where s.token = p_token;
$$;
revoke all on function public.shared_article(text) from public;
grant execute on function public.shared_article(text) to anon, authenticated;

drop function public.shared_material(text);
create function public.shared_material(p_token text)
returns table (title text, html text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.title, m.html
  from public.materiales m
  where p_token is not null and m.share_token = p_token and m.html is not null;
$$;
revoke all on function public.shared_material(text) from public;
grant execute on function public.shared_material(text) to anon, authenticated;
