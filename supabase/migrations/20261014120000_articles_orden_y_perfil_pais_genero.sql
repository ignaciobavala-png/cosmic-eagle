-- 14/10: orden manual de los contenidos + pais y genero en el perfil (CRM).
--
-- 1) `articles.sort_order`: la clienta quiere decidir el orden en que se ven los
--    contenidos desde el panel. Menor numero = primero. Se rellena con el orden
--    que ya tenia el sitio (publicado mas reciente primero) para que nada se
--    mueva hasta que ella lo mueva. Los nuevos entran con 0, o sea arriba.
-- 2) `profiles.country` y `profiles.gender`: el CRM no mostraba el pais de casi
--    nadie porque salia del formulario de salud (etapa 2) y el genero no estaba
--    en ningun lado. Son opcionales: una cuenta vieja no los tiene.
--
-- `profiles` tiene el UPDATE revocado a nivel tabla y otorgado por columna: las
-- columnas nuevas tienen que entrar al grant o nadie las puede escribir.

alter table public.articles add column sort_order integer not null default 0;

update public.articles a
set sort_order = r.pos
from (
  select id, row_number() over (order by published_at desc nulls last, created_at desc) as pos
  from public.articles
) r
where r.id = a.id;

grant insert (sort_order) on public.articles to authenticated;
grant update (sort_order) on public.articles to authenticated;

-- La vista solo acepta columnas nuevas AL FINAL. Sigue siendo SOLO SELECT.
create or replace view public.articles_public
  with (security_invoker = false) as
select
  a.id,
  a.slug,
  a.title,
  a.excerpt,
  a.cover_url,
  a.category,
  a.access_level,
  a.published_at,
  a.title_en,
  a.excerpt_en,
  a.sort_order
from public.articles a
where a.status = 'published'::public.article_status;

alter table public.profiles
  add column country text,
  add column gender text,
  add constraint profiles_gender_valid
    check (gender is null or gender in ('mujer', 'hombre', 'no_binario', 'prefiero_no_decir'));

grant update (country, gender) on public.profiles to authenticated;
