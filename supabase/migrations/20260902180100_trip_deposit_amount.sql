-- El monto de la sena, por viaje, y lo que efectivamente entro.
--
-- Dos columnas, y son dos cosas distintas a proposito:
--
--   trips.deposit_amount        cuanto hay que mandar para reservar (lo publica ella)
--   applications.amount_paid    cuanto mando esta persona (lo registra Estela)
--
-- La segunda no se deriva de la primera: la sena es lo que se pide, no
-- necesariamente lo que llega. Los correos [3A] y [3B] prometen decir
-- "{monto pagado}" y "queda un saldo pendiente de {monto pendiente}", y sin el
-- monto real esas dos frases serian una suposicion. El saldo es
-- `trips.price - applications.amount_paid`.
--
-- Es tambien lo que deja la puerta abierta al pago en cuotas sin otra
-- migracion: si terminan aceptando varios pagos parciales, cada uno suma acá.
-- (Esa pregunta —la 3 de docs/consulta-sofia-pagos.txt— sigue sin respuesta.)

alter table public.trips
  add column deposit_amount numeric;

comment on column public.trips.deposit_amount is
  'Monto de la sena para reservar el cupo. NULL = este viaje no ofrece sena, se paga el total.';

-- `null` = sin sena. Si hay sena tiene que ser positiva y menor que el total, o
-- no seria una sena. El form del admin valida antes y da un mensaje claro; esto
-- es el respaldo.
alter table public.trips
  add constraint trips_deposit_amount_check
  check (deposit_amount is null or (deposit_amount > 0 and deposit_amount < price));

alter table public.applications
  add column amount_paid numeric not null default 0;

comment on column public.applications.amount_paid is
  'Total recibido de esta persona hasta ahora, en la moneda del viaje (USD). Lo registra Estela a mano junto con el estado de pago.';

alter table public.applications
  add constraint applications_amount_paid_check check (amount_paid >= 0);

-- OJO: `authenticated` no tiene UPDATE a nivel tabla sobre `applications` —se
-- revoco en la migracion de dos etapas (20260819180444) y se devolvio columna
-- por columna. El admin es `authenticated` como todos, asi que sin este grant
-- no podria registrar el monto: la fila se actualizaria sin error visible en la
-- policy pero el UPDATE seria rechazado por permisos.
grant update (amount_paid) on public.applications to authenticated;
