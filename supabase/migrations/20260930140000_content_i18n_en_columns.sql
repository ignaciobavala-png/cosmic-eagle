-- Etapa 3 del inglés (docs/I18N.md §6): el contenido que carga la clienta.
--
-- Mismo patrón que `testimonials` (20260930030000): columnas `_en` nulables, y
-- si están vacías la página pública cae al castellano. Nada de esto es
-- obligatorio: un viaje recién cargado sigue apareciendo en /en, en castellano.
--
-- `site_content` no necesita migración: el inglés de un slot de texto es la
-- fila hermana `<key>.en` (ver src/lib/site-content.ts).
--
-- El programa de un viaje (`trips.schedule`, jsonb) tampoco: cada item suma
-- una clave opcional `activity_en` (ver src/lib/trip-schedule.ts).

alter table public.trips
  add column title_en text,
  add column description_en text,
  add column venue_type_en text,
  add column includes_en text,
  add column terms_en text,
  add column arrival_notes_en text,
  add column packing_list_en text;

alter table public.articles
  add column title_en text,
  add column excerpt_en text,
  add column body_en text;

alter table public.faqs
  add column question_en text,
  add column answer_en text;

alter table public.legal_documents
  add column title_en text,
  add column body_en text;

alter table public.payment_methods
  add column label_en text,
  add column audience_en text,
  add column instructions_en text;

-- La trampa del "revoke update": `articles`, `faqs` y `legal_documents` tienen
-- grants POR COLUMNA, y una columna nueva que no entra acá el panel no la puede
-- escribir aunque la policy deje. `trips` y `payment_methods` tienen el grant a
-- nivel tabla y las columnas nuevas quedan cubiertas solas.
grant insert (title_en, excerpt_en, body_en) on public.articles to authenticated;
grant update (title_en, excerpt_en, body_en) on public.articles to authenticated;

grant insert (question_en, answer_en) on public.faqs to authenticated;
grant update (question_en, answer_en) on public.faqs to authenticated;

-- legal_documents no acepta insert de nadie: las filas las siembra la migración.
grant update (title_en, body_en) on public.legal_documents to authenticated;

-- La vista de la biblioteca expone los metadatos de lo cerrado (el candado):
-- el título y la bajada en inglés van con ellos. `create or replace view` sólo
-- acepta columnas nuevas AL FINAL. Los grants de la vista (sólo SELECT) se
-- conservan en el replace.
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
  a.excerpt_en
from public.articles a
where a.status = 'published'::public.article_status;
