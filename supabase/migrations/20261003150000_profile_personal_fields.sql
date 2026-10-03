-- Perfil personal del viajero (correcciones de la organización del 03/10, §5.1,
-- opción A): lo estable de la persona, que no cambia de un viaje a otro. La
-- salud NO va acá: sigue asociada a cada solicitud (filtro corto + formulario
-- extenso), que es donde vive la RLS de los datos médicos.
--
-- Columnas en `profiles` y no tabla aparte: es uno a uno con la cuenta, la
-- policy `profiles_select_own` ya deja leer a la persona y al admin, y
-- `profiles_update_own` ya acota la escritura a la fila propia.

alter table public.profiles
  add column phone text,
  add column profession text,
  add column social_url text,
  add column prior_experience text,
  add column spiritual_practices text,
  add column referral_source text,
  add column referred_by text,
  add column profile_completed_at timestamptz;

-- `profiles` tiene revocado el UPDATE a nivel tabla y lo otorga por columna
-- (escalada de `is_admin`, 31/07): una columna nueva que no entra acá no la
-- puede escribir nadie, ni el admin.
grant update (
  phone,
  profession,
  social_url,
  prior_experience,
  spiritual_practices,
  referral_source,
  referred_by,
  profile_completed_at
) on public.profiles to authenticated;
