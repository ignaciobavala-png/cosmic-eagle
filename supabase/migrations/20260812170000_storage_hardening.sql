-- Endurecimiento de los buckets, salido de la auditoria del 2026-08-12.

-- 1. Ningun bucket tenia limite de tamano ni tipos permitidos: el tope de 5MB
-- vivia solo en el server action, y un upload que no pase por ahi no lo respeta.
-- SVG queda fuera a proposito: los tres buckets son publicos y un SVG servido
-- inline puede llevar script adentro.
update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif','image/gif']
where id in ('site-assets', 'trip-images');

update storage.buckets
set file_size_limit = 3 * 1024 * 1024,  -- el mismo tope que valida updateAvatar
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif']
where id = 'avatars';

-- 2. `avatars` arrastraba la policy de SELECT abierta a `public` sobre todo el
-- bucket (lint 0025), que estaba anotada como pendiente en CLAUDE.md. Leer un
-- avatar por URL NO pasa por RLS, asi que esa policy no habilitaba la lectura
-- publica: lo unico que habilitaba era listar el bucket entero, es decir,
-- enumerar los user_id que tienen foto.
--
-- El SELECT se restringe al dueno de la carpeta, que igual lo necesita porque
-- el upsert de Storage exige SELECT + INSERT + UPDATE.
drop policy if exists avatars_public_read on storage.objects;

create policy avatars_select_own on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
