-- Portada de viaje: columna en `trips` + bucket de Storage escribible solo por admin.

alter table public.trips add column image_url text;

insert into storage.buckets (id, name, public)
values ('trip-images', 'trip-images', true)
on conflict (id) do nothing;

-- El bucket es publico: las portadas se leen por URL directa (home, /viajes y
-- el detalle), que no pasa por RLS. Por eso NO hay policy de SELECT abierta:
-- solo serviria para dejar listar el bucket entero (lint 0025). El SELECT se
-- limita a admin, que igual lo necesita porque el upsert de Storage pide
-- INSERT + SELECT + UPDATE.
create policy trip_images_select_admin on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'trip-images'
    and (select private.is_admin())
  );

-- Escritura solo admin. A diferencia de `avatars`, aca no hay carpeta por
-- usuario: el criterio es el rol, no la propiedad del archivo.
create policy trip_images_insert_admin on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'trip-images'
    and (select private.is_admin())
  );

create policy trip_images_update_admin on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'trip-images'
    and (select private.is_admin())
  )
  with check (
    bucket_id = 'trip-images'
    and (select private.is_admin())
  );

create policy trip_images_delete_admin on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'trip-images'
    and (select private.is_admin())
  );
