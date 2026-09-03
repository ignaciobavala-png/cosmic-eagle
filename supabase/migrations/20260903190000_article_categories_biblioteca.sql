-- Las cinco categorias de la biblioteca (docs/BIBLIOTECA.md §1.1).
--
-- El enum viejo tenia tres valores que salian de docs/CONTENT_MAP.md
-- (biblioteca / ciencia / testimonios). El documento que mando Sofia el 03/09
-- define otros cinco cuerpos de contenido y ninguno coincide del todo.
--
-- Se REEMPLAZA el tipo en vez de sumarle valores con `alter type ... add value`:
--
-- 1. La tabla esta en **cero filas** (verificado antes de escribir esto), asi
--    que no hay nada que migrar y no hace falta convivir con los nombres viejos.
-- 2. `add value` no se puede usar en la misma transaccion en la que se agrega,
--    y eso obliga a partir la migracion en dos (ya paso tres veces en este
--    proyecto: payment_proof, conversemos y deposit_paid). Reemplazar el tipo
--    entero se hace de una.
-- 3. Dejar `biblioteca` y `ciencia` colgando seria dejar dos categorias muertas
--    en el desplegable del panel.
--
-- El guard de abajo hace que esta migracion se caiga sola si alguien la corre
-- contra una base con articulos cargados, en vez de perderlos en silencio.

do $$
begin
  if exists (select 1 from public.articles) then
    raise exception
      'articles tiene filas: esta migracion asume la tabla vacia. Migrar los valores a mano antes de correrla.';
  end if;
end;
$$;

alter table public.articles alter column category drop default;
alter table public.articles alter column category type text;

drop type public.article_category;

create type public.article_category as enum (
  'preparacion',
  'salud',
  'evolucion',
  'tecnologia',
  'testimonios'
);

alter table public.articles
  alter column category type public.article_category
  using category::public.article_category;

alter table public.articles
  alter column category set default 'preparacion';

-- Los grants por columna se reponen por las dudas: cambiar el tipo de una
-- columna los conserva, pero es barato ser explicito y esta tabla depende de
-- ellos para que el trigger sea el unico que escribe published_at/updated_by.
revoke insert, update on public.articles from authenticated;
grant insert (slug, title, excerpt, body, cover_url, category, status)
  on public.articles to authenticated;
grant update (slug, title, excerpt, body, cover_url, category, status)
  on public.articles to authenticated;
