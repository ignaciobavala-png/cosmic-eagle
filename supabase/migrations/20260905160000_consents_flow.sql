-- El consentimiento informado, que hasta hoy era una tabla sin pantalla.
--
-- La tabla `consents` existe desde el schema original (20260725235104) pero
-- nunca se pudo construir la UI: los textos legales son de la clienta y no
-- estaban en el repo ("No hacer" de CLAUDE.md). El 05/09/2026 Ignacio pasó el
-- link del formulario de Google que usan hoy y el texto quedó transcripto
-- literal en `src/lib/consent.ts` y en `docs/CONSENTIMIENTO.md`.
--
-- Esta migración no agrega columnas: el schema ya calzaba (confirmations jsonb
-- + digital_signature + consent_version). Lo que arregla es el permiso, que se
-- escribió cuando no había pantalla y quedó más flojo que el del resto del
-- embudo.

-- ---------------------------------------------------------------------------
-- 1. El insert exige la solicitud propia y aprobada
-- ---------------------------------------------------------------------------

-- Antes alcanzaba con `auth.uid() = user_id`: cualquier persona logueada podía
-- firmar un consentimiento apuntando al `application_id` de otra, o al suyo
-- pero sin estar aprobada. Es el mismo guard que ya usa el formulario de salud
-- (`private.owns_approved_application`, security definer porque el postulante
-- no tiene SELECT sobre `applications`).
drop policy consents_insert_own on public.consents;

create policy consents_insert_own on public.consents
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and private.owns_approved_application(application_id)
  );

-- ---------------------------------------------------------------------------
-- 2. `user_id` y `trip_id` los pone la base, no el formulario
-- ---------------------------------------------------------------------------

-- Las dos columnas son redundantes con `application_id` y venían del schema
-- viejo. Mientras las escriba el cliente, un consentimiento puede quedar
-- colgado del viaje equivocado sin que ninguna policy lo note. El trigger las
-- deriva de la solicitud y descarta lo que haya mandado el formulario.
--
-- **Ojo con el orden**: un trigger BEFORE corre ANTES de que se evalúe el WITH
-- CHECK de la policy, así que la RLS ve la fila ya corregida. Verificado con
-- `set role`: un insert con el `user_id` de otra persona sobre una solicitud
-- propia PASA, porque el trigger lo reescribe primero. O sea que el
-- `auth.uid() = user_id` de la policy no es lo que sostiene la seguridad acá —
-- lo que la sostiene es `owns_approved_application(application_id)`. Se deja
-- igual: sin el trigger seguiría haciendo falta.
create or replace function private.set_consent_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select a.user_id, a.trip_id
    into new.user_id, new.trip_id
  from public.applications a
  where a.id = new.application_id;

  if new.user_id is null then
    raise exception 'La solicitud % no existe', new.application_id;
  end if;

  -- La fecha de la firma es la del servidor. El formulario de Google la pedía
  -- escrita a mano; una fecha declarada por quien firma no sirve como registro.
  new.date := current_date;

  return new;
end;
$$;

create trigger set_consent_owner
  before insert on public.consents
  for each row execute function private.set_consent_owner();

-- ---------------------------------------------------------------------------
-- 3. Un consentimiento firmado es inmutable
-- ---------------------------------------------------------------------------

-- La policy `consents_admin_all` daba UPDATE y DELETE al admin, que es
-- `authenticated` como todos. Un registro legal firmado no se edita desde el
-- panel: si hay que corregir algo, se firma de nuevo. `service_role` conserva
-- todo para una intervención manual.
drop policy consents_admin_all on public.consents;

create policy consents_admin_select on public.consents
  for select
  to authenticated
  using ((select private.is_admin()));

revoke update, delete, truncate on public.consents from authenticated, anon;
-- `anon` nunca tuvo policy, así que su INSERT/SELECT ya era inerte; se le
-- sacan igual para que el grant no diga lo contrario de lo que pasa.
revoke insert, select on public.consents from anon;
