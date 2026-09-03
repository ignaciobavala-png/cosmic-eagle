-- Envíos programados por fecha: el registro de lo ya enviado.
--
-- Es la pieza 4 de docs/COMUNICACIONES.md §4, la que sola destraba seis de los
-- correos que faltan ([3B], [4A], [6], [7], [8], [9]). Hasta hoy todos los mails
-- de la app salían de un server action —alguien aprieta un botón y sale el
-- correo— y por eso no existía ninguno que dependiera del calendario.
--
-- Un cron diario (`/api/cron/emails`) barre las solicitudes, calcula a quién le
-- toca cada correo y manda. Esta tabla es lo que evita que al día siguiente le
-- vuelva a mandar lo mismo a la misma persona.
--
-- Tres decisiones de forma:
--
-- 1. **Una fila por (solicitud, tipo), con índice único.** Es el mecanismo de
--    "no remandar", equivalente a releer el estado anterior antes del update que
--    ya usan `reviewApplication` y `markPayment`. Acá no hay estado anterior que
--    leer: el disparador es el paso del tiempo, así que el registro tiene que
--    ser explícito.
-- 2. **Los fallos se registran igual** (`ok = false` + `error`). Si Resend
--    rechaza el envío no se reintenta al día siguiente: se anota el fallo en la
--    casilla del panel y alguien escribe a mano, que es el mismo criterio de los
--    mails que ya existen. Reintentar en silencio todos los días llenaría la
--    casilla de avisos con el mismo problema.
--    **La excepción es `not_configured`**, que no escribe fila ninguna: eso no es
--    un mail que falló, es el sistema que todavía no está encendido (hoy mismo,
--    sin el dominio verificado en Resend). Si escribiera fila, el día que Sofía
--    conecte el DNS todos los envíos pendientes ya estarían quemados como
--    fallidos y no saldría ninguno.
-- 3. **La escribe el cron con la service role key**, no un trigger ni una
--    sesión: quien manda el mail es un proceso sin usuario. Por eso no hay
--    policy de insert — nadie inserta acá con sesión, y la service role saltea
--    la RLS por definición.

create type public.scheduled_email_kind as enum (
  'payment_reminder',  -- [3B] recordatorio de saldo
  'forms_pending',     -- [4A] pagó pero no completó los formularios
  'preparation',       -- [6]  comienza tu preparación
  'final_details',     -- [7]  datos finales de llegada
  'integration',       -- [8]  material de integración
  'feedback'           -- [9]  tu mirada
);

-- Los seis valores se declaran de una, aunque hoy sólo se manden los dos
-- primeros: los otros cuatro dependen de contenido que no existe (`/preparacion`,
-- los campos de logística de `trips`, el material de integración, el formulario
-- de feedback). Declararlos ahora cuesta cero y evita la trampa de `alter type
-- ... add value`, que no se puede USAR en la misma transacción en que se agrega
-- y que en este proyecto ya costó tres migraciones partidas en dos.

create table public.scheduled_email_log (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  kind public.scheduled_email_kind not null,
  sent_at timestamptz not null default now(),
  -- `false` = Resend lo rechazó. La fila existe igual, para no reintentar.
  ok boolean not null default true,
  error text
);

-- El corazón del asunto: un correo programado sale UNA vez por solicitud.
create unique index scheduled_email_log_once_idx
  on public.scheduled_email_log (application_id, kind);

create index scheduled_email_log_sent_at_idx
  on public.scheduled_email_log (sent_at desc);

alter table public.scheduled_email_log enable row level security;

-- Sólo lectura, y sólo admin: la fila dice a quién se le escribió y cuándo.
-- No hay policy de escritura para nadie con sesión — escribe el cron.
create policy scheduled_email_log_admin_read on public.scheduled_email_log
  for select
  to authenticated
  using ((select private.is_admin()));

-- El revoke a nivel tabla va primero y sin excepciones: si el rol conserva el
-- privilegio a nivel tabla, un revoke por columna no hace nada (Postgres avisa
-- por WARNING y sigue). Ver 20260731210000_fix_profiles_is_admin_grant.sql.
revoke insert, update, delete on public.scheduled_email_log from authenticated;
revoke all on public.scheduled_email_log from anon;
