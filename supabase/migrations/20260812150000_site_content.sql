-- Multimedia y textos editables desde el admin.
--
-- La tabla guarda SOLO overrides: que slots existen y cual es su valor por
-- defecto lo declara el codigo (src/lib/site-content.ts). Una fila que no
-- matchea ningun slot del registro se ignora sola, asi que renombrar o borrar
-- un slot nunca rompe el sitio, y una key sin fila renderiza el asset del repo.

create table public.site_content (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.site_content enable row level security;

-- Lectura publica: estos textos e imagenes son el contenido del sitio, los lee
-- cualquier visitante sin sesion.
create policy site_content_select_public on public.site_content
  for select
  to anon, authenticated
  using (true);

create policy site_content_insert_admin on public.site_content
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy site_content_update_admin on public.site_content
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Volver un slot a su valor original = borrar la fila.
create policy site_content_delete_admin on public.site_content
  for delete
  to authenticated
  using ((select private.is_admin()));

-- Grants por columna. El orden importa: `revoke` a nivel tabla primero, si no
-- el grant por columna no hace nada (ver la migracion
-- 20260731210000_fix_profiles_is_admin_grant.sql). `updated_at`/`updated_by`
-- quedan fuera a proposito: los escribe el trigger, no el cliente.
revoke insert, update on public.site_content from authenticated;
grant insert (key, value) on public.site_content to authenticated;
grant update (value) on public.site_content to authenticated;

create or replace function private.touch_site_content()
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

create trigger site_content_touch
  before insert or update on public.site_content
  for each row
  execute function private.touch_site_content();

-- Bucket de assets del sitio. Mismo criterio que `trip-images`: publico para
-- leer por URL (esa lectura no pasa por RLS), escritura solo admin, y sin
-- policy de SELECT abierta — solo habilitaria listar el bucket (lint 0025).
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

create policy site_assets_select_admin on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'site-assets'
    and (select private.is_admin())
  );

create policy site_assets_insert_admin on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'site-assets'
    and (select private.is_admin())
  );

create policy site_assets_update_admin on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'site-assets'
    and (select private.is_admin())
  )
  with check (
    bucket_id = 'site-assets'
    and (select private.is_admin())
  );

create policy site_assets_delete_admin on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'site-assets'
    and (select private.is_admin())
  );
