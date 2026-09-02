-- FAQs: preguntas frecuentes editables desde /admin/faqs.
--
-- Por que ahora: el bloque "Salud y Seguridad" de /viajes ya dice "visita
-- nuestras FAQs" y no habia adonde ir — es un link muerto del codigo aprobado
-- de Julia. Sofia escribio DOS juegos (uno por tipo de experiencia) en los
-- anexos de `web-cosmic-journey-ES.md`, pero ese archivo se perdio y no esta en
-- el repo: por eso la tabla queda VACIA y el texto lo cargan ellas.
--
-- Mismo criterio que `testimonials` y `articles`, y por la misma razon: la
-- CANTIDAD de preguntas la decide la clienta, asi que no puede ser `site_content`
-- —ahi el codigo declara cuantos slots hay— ni constantes en el codigo, que
-- obligarian a un deploy por cada pregunta nueva.

create type public.faq_placement as enum ('general', 'sesiones', 'viajes');

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  -- En que juego de preguntas cae. Una pregunta vive en uno solo: los dos
  -- juegos de Sofia tienen respuestas distintas para preguntas parecidas
  -- (la preparacion previa son cinco dias en Sesiones y una semana en Viajes),
  -- asi que no es una relacion muchos a muchos.
  placement public.faq_placement not null,
  question text not null,
  -- Texto plano con las mismas dos reglas que el cuerpo de `articles`: linea en
  -- blanco = parrafo. Nada de HTML del formulario — no hay sanitizador en el
  -- proyecto y seria un XSS almacenado.
  answer text not null,
  -- Sin flujo de borrador: una FAQ es un parrafo, no se escribe en varias
  -- sesiones. Despublicar es esconderla sin perderla.
  is_published boolean not null default true,
  -- Orden manual dentro de su juego. Empatadas, desempata la fecha de carga.
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint faqs_question_not_blank check (btrim(question) <> ''),
  constraint faqs_answer_not_blank check (btrim(answer) <> '')
);

create index faqs_placement_idx
  on public.faqs (placement, is_published, sort_order, created_at);

alter table public.faqs enable row level security;

-- Lectura publica SOLO de lo publicado, igual que `articles` y `testimonials`:
-- lo despublicado no sale de la base y no depende de que cada pagina se acuerde
-- de filtrar (a diferencia de `trips`, donde el filtro de borradores lo hace
-- cada ruta).
create policy faqs_select_published on public.faqs
  for select
  to anon, authenticated
  using (is_published);

create policy faqs_select_admin on public.faqs
  for select
  to authenticated
  using ((select private.is_admin()));

create policy faqs_insert_admin on public.faqs
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy faqs_update_admin on public.faqs
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy faqs_delete_admin on public.faqs
  for delete
  to authenticated
  using ((select private.is_admin()));

-- Grants por columna. El `revoke` a nivel tabla va PRIMERO: sin eso el grant por
-- columna no hace nada (ver 20260731210000_fix_profiles_is_admin_grant.sql).
revoke insert, update on public.faqs from authenticated;
grant insert (placement, question, answer, is_published, sort_order)
  on public.faqs to authenticated;
grant update (placement, question, answer, is_published, sort_order)
  on public.faqs to authenticated;

create or replace function private.touch_faq()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger faqs_touch
  before insert or update on public.faqs
  for each row
  execute function private.touch_faq();
