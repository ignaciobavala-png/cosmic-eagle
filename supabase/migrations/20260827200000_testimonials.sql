-- Testimonios: pasan de constantes en el codigo a tabla editable desde
-- /admin/testimonios.
--
-- Por que ahora: el rediseño de Julia (docs/REDISENO_JULIA_HTML.md) pide TRES
-- juegos con textos distintos —home, sesiones cosmicas y viajes cosmicos— y ella
-- confirmo el 27/08 que no son el mismo repetido. Tres listas hardcodeadas en
-- `constants.ts` obligarian a un deploy por cada testimonio nuevo, que es
-- justamente lo que se resolvio con `articles`.
--
-- No es `site_content`: ahi el codigo declara cuantos slots hay, y aca la
-- cantidad de testimonios la decide la clienta.

create type public.testimonial_placement as enum ('home', 'sesiones', 'viajes');

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  -- Donde se muestra. Un testimonio vive en una sola seccion: si el mismo texto
  -- sirve para dos, se carga dos veces (son tres piezas de copy distintas, no
  -- una relacion muchos a muchos).
  placement public.testimonial_placement not null,
  quote text not null,
  author_name text not null,
  -- Pais o ciudad; es lo que se imprime despues del guion en la firma.
  author_location text,
  -- Sin flujo de borrador como en `articles`: un testimonio es un parrafo, no
  -- se escribe en varias sesiones. Despublicar es esconderlo sin borrarlo.
  is_published boolean not null default true,
  -- Orden manual dentro de su seccion. Empatados, desempata la fecha de carga.
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint testimonials_quote_not_blank check (btrim(quote) <> ''),
  constraint testimonials_author_not_blank check (btrim(author_name) <> '')
);

create index testimonials_placement_idx
  on public.testimonials (placement, is_published, sort_order, created_at);

alter table public.testimonials enable row level security;

-- Lectura publica SOLO de lo publicado, igual que `articles`: lo despublicado
-- no sale de la base y no depende de que cada pagina se acuerde de filtrar.
create policy testimonials_select_published on public.testimonials
  for select
  to anon, authenticated
  using (is_published);

create policy testimonials_select_admin on public.testimonials
  for select
  to authenticated
  using ((select private.is_admin()));

create policy testimonials_insert_admin on public.testimonials
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy testimonials_update_admin on public.testimonials
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy testimonials_delete_admin on public.testimonials
  for delete
  to authenticated
  using ((select private.is_admin()));

-- Grants por columna. El `revoke` a nivel tabla va PRIMERO: sin eso el grant por
-- columna no hace nada (ver 20260731210000_fix_profiles_is_admin_grant.sql).
revoke insert, update on public.testimonials from authenticated;
grant insert (placement, quote, author_name, author_location, is_published, sort_order)
  on public.testimonials to authenticated;
grant update (placement, quote, author_name, author_location, is_published, sort_order)
  on public.testimonials to authenticated;

create or replace function private.touch_testimonial()
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

create trigger testimonials_touch
  before insert or update on public.testimonials
  for each row
  execute function private.touch_testimonial();

-- Los tres testimonios reales que estaban en `constants.ts` desde el principio.
-- Se siembran en `home` para que "Voces de Luz" no quede vacia al soltar las
-- constantes; los de sesiones y viajes los carga la clienta.
insert into public.testimonials (placement, quote, author_name, author_location, sort_order)
values
  ('home', 'Todavía me sorprende la experiencia. Fue el viaje más increíble de mi vida. Sigo descubriendo nuevas comprensiones y habilidades que se activaron ese día, además de recibir información valiosa a través de mis sueños y prácticas. Me siento inmensamente agradecida.', 'Valeria', 'Uruguay', 1),
  ('home', 'Fue un regalo que cambió mi vida para siempre, evocando una sensación de amor que me acompaña en cada desafío diario. Accedí a un mundo que intuía, abriéndome a una maravillosa realidad oculta.', 'Claudia', 'Chile', 2),
  ('home', 'Un viaje interior memorable, donde experimenté directamente un amor profundo e incondicional. Me abrió las puertas a una nueva perspectiva del mundo, a comprender quién soy realmente y el rumbo que quiero darle a mi vida.', 'Andrew', 'Inglaterra', 3);
