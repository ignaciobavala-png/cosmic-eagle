-- security definer functions no deben vivir en un schema expuesto por la Data API.
-- Mover a `private` no rompe policies/triggers existentes: Postgres los referencia
-- por OID, no por nombre calificado.
create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to postgres, service_role;

alter function public.handle_new_user() set schema private;
alter function public.is_admin() set schema private;

-- Las RLS policies evaluan is_admin() como el rol authenticated: necesita
-- usage del schema + execute de la funcion (ninguno se hereda por default aca).
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
