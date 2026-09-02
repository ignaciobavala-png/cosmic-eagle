-- La persona tiene que poder ver cuanto pago y cuanto le falta.
--
-- `my_applications` es la unica puerta del postulante a su propia solicitud: la
-- tabla base no le devuelve ninguna fila, ni siquiera las suyas (por eso existe
-- la vista, ver 20260819180444). Sin `amount_paid` ahi, la pantalla de estado
-- podria decir "reservado" pero no "queda un saldo de X" — que es justo lo que
-- promete el correo [3A] de Sofia.
--
-- La columna nueva va AL FINAL: `create or replace view` solo acepta agregar
-- columnas al final, y renombrar o reordenar obliga a dropear la vista (y con
-- ella los grants).
--
-- Sigue siendo `security_invoker = false` a proposito, como desde el principio:
-- es lo que le permite leer una tabla donde el usuario no tiene SELECT, y el
-- filtro por auth.uid() es lo unico que la hace segura. El advisor lint 0010 la
-- marca a proposito.

create or replace view public.my_applications
with (security_invoker = false)
as
select
  a.id,
  a.trip_id,
  a.status,
  a.payment_status,
  a.previous_ceremonies = 0 as is_first_time,
  exists (
    select 1 from public.health_form_first_time h where h.application_id = a.id
  ) as health_form_submitted,
  exists (
    select 1 from public.consents c where c.application_id = a.id
  ) as consent_submitted,
  a.created_at,
  a.reviewed_at,
  exists (
    select 1 from public.payment_proofs p where p.application_id = a.id
  ) as payment_proof_submitted,
  (select max(p.created_at) from public.payment_proofs p where p.application_id = a.id)
    as payment_proof_at,
  a.amount_paid
from public.applications a
where a.user_id = (select auth.uid());

revoke all on public.my_applications from anon;
grant select on public.my_applications to authenticated;
