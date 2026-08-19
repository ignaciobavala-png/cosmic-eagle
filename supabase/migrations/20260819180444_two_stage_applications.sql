-- La inscripción pasa a tener dos etapas, no una.
--
-- Orden confirmado por Ignacio el 2026-08-19 (docs/FLUJO_INSCRIPCION.md):
--
--   registro -> filtro corto -> revisión de Estela -> pago
--            -> formulario de salud extenso -> consentimiento -> logística
--
-- Hasta hoy el modelo asumía UN formulario por solicitud, y las dos tablas
-- (`applications_first_time` / `applications_returning`) eran alternativas: se
-- elegía una según el historial del postulante. En el flujo real dejan de ser
-- alternativas y pasan a ser etapas: todos llenan primero el filtro corto y el
-- extenso llega después de pagar.
--
-- Forma elegida: padre + hijos.
--
--   applications              <- el filtro corto, el estado y la revisión
--     └─ health_form_first_time  <- el extenso, posterior al pago
--     └─ consents
--
-- El motivo de fondo es de seguridad, no de prolijidad: con etapas encadenadas
-- **cada etapa es un INSERT nuevo**, y el postulante nunca necesita UPDATE sobre
-- una fila con datos médicos. La alternativa (una fila que se completa) obligaba
-- a abrir UPDATE sobre datos de salud y a blindarlo con grants por columna, que
-- es exactamente donde este proyecto ya se quemó una vez (ver
-- 20260731210000_fix_profiles_is_admin_grant.sql).
--
-- Se dropea en vez de migrar porque las tres tablas estaban en CERO filas: no
-- hubo ninguna solicitud real todavía.
--
-- Lo que NO entra acá y hay que recordar:
--   * Las preguntas del filtro son las del formulario "Viajer@s" (las únicas
--     relevadas). Sofía describe un filtro de 3 preguntas que no existe como
--     Google Form; si lo confirma, se ajustan estas columnas — la tabla es nueva
--     y no tiene datos.
--   * No hay `health_form_returning`. Con el filtro cubriendo lo que pedía
--     Viajer@s, un recurrente no tiene etapa 2 conocida. Si aparece, es una
--     tabla hermana, no una columna acá.
--   * La pasarela de pago no está elegida. `payment_status` alcanza para que
--     Estela marque el pago a mano y para que la pasarela, cuando llegue, tenga
--     dónde escribir.

-- ---------------------------------------------------------------------------
-- 1. Fuera el modelo de una sola etapa
-- ---------------------------------------------------------------------------

drop view if exists public.my_applications_first_time;
drop view if exists public.my_applications_returning;

drop trigger if exists applications_first_time_notify on public.applications_first_time;
drop trigger if exists applications_returning_notify on public.applications_returning;

alter table public.consents
  drop constraint consents_application_ref_check,
  drop column application_first_time_id,
  drop column application_returning_id;

alter table public.admin_notifications
  drop column application_first_time_id,
  drop column application_returning_id;

drop table public.applications_returning;
drop table public.applications_first_time;

-- ---------------------------------------------------------------------------
-- 2. La solicitud: filtro corto + estado + revisión + pago
-- ---------------------------------------------------------------------------

-- 'waived' existe para las invitaciones y cupones de docs/CRM.md §5: hay
-- solicitudes que avanzan sin pagar y no se pueden marcar 'paid' mintiendo.
create type public.payment_status as enum ('pending', 'paid', 'waived');

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete restrict,

  -- Identidad. El extenso ya no vuelve a pedir nombre, mail ni teléfono.
  full_name text not null,
  email text not null,
  phone text,

  -- 0 = primerizo. Reemplaza a la bifurcación por historial de aprobaciones:
  -- lo declara la persona, igual que en el formulario de Estela, y es lo que
  -- decide si después del pago le toca el extenso.
  previous_ceremonies integer not null default 0 check (previous_ceremonies >= 0),

  -- El filtro corto (provisorio, ver cabecera).
  new_treatment boolean not null,
  new_treatment_detail text,
  stress_anxiety boolean not null,
  stress_anxiety_detail text,
  theme text,
  comment text,

  status public.application_status not null default 'pending_review',
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,

  payment_status public.payment_status not null default 'pending',
  paid_at timestamptz,
  -- Referencia libre mientras no haya pasarela: "transferencia 12/09", el id de
  -- la operación, lo que Estela tenga a mano.
  payment_reference text,

  created_at timestamptz not null default now()
);

create index applications_user_id_idx on public.applications (user_id);
create index applications_trip_id_idx on public.applications (trip_id);
create index applications_reviewed_by_idx on public.applications (reviewed_by);

-- Una sola solicitud viva por viaje, pero un rechazo o un vencimiento no
-- bloquean volver a postularse al mismo viaje (índice PARCIAL, a propósito).
create unique index applications_one_active_per_trip_idx
  on public.applications (user_id, trip_id)
  where status in ('pending_review', 'approved');

alter table public.applications enable row level security;

create policy applications_admin_all on public.applications
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- El postulante crea su solicitud y no la relee por la tabla: el estado lo mira
-- por la vista `my_applications`, que no expone las respuestas.
create policy applications_insert_own on public.applications
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Grants por columna. El revoke a nivel tabla va PRIMERO: si no, el grant por
-- columna no hace nada (ver 20260731210000_fix_profiles_is_admin_grant.sql).
--
-- Ojo con lo obvio: el admin también es `authenticated`, así que revocar y no
-- devolver nada lo deja sin poder aprobar. Se devuelven exactamente las columnas
-- que escribe la revisión — quién puede escribirlas lo sigue decidiendo la RLS
-- (`applications_admin_all`), esto sólo acota QUÉ se puede escribir. Las
-- respuestas del filtro quedan inmutables para todo el mundo.
revoke update on public.applications from authenticated;
grant update (status, reviewed_by, reviewed_at, payment_status, paid_at, payment_reference)
  on public.applications to authenticated;

-- ---------------------------------------------------------------------------
-- 3. La etapa 2: el formulario de salud extenso
-- ---------------------------------------------------------------------------

create table public.health_form_first_time (
  id uuid primary key default gen_random_uuid(),
  -- Una sola por solicitud. Sin user_id ni trip_id: cuelgan del padre.
  application_id uuid not null unique
    references public.applications (id) on delete cascade,

  age integer not null check (age > 0),
  height text not null,
  weight text not null,
  country text not null,
  occupation text not null,

  health_condition boolean not null,
  health_condition_detail text,
  stress_anxiety boolean not null,
  stress_anxiety_detail text,
  trauma boolean not null,
  trauma_detail text,
  substance_use boolean not null,
  substance_use_detail text,
  allergies boolean not null,
  allergies_detail text,
  spiritual_practice boolean not null,
  spiritual_practice_detail text,
  first_time_plants boolean not null,
  plants_detail text,
  has_themes boolean not null,
  themes_detail text,
  fears boolean not null,
  fears_detail text,
  comment text,

  created_at timestamptz not null default now()
);

alter table public.health_form_first_time enable row level security;

-- Chequear la propiedad de la solicitud desde la policy necesita LEER
-- `applications`, y el postulante no tiene SELECT ahí. De ahí el definer: es el
-- mismo patrón que `private.is_admin()`.
create or replace function private.owns_approved_application(app_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.applications a
    where a.id = app_id
      and a.user_id = (select auth.uid())
      and a.status = 'approved'
  );
$$;

revoke execute on function private.owns_approved_application(uuid) from public, anon;
grant execute on function private.owns_approved_application(uuid) to authenticated;

create policy health_form_first_time_admin_all on public.health_form_first_time
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- El extenso sólo se puede cargar sobre una solicitud propia y ya aprobada.
-- El pago NO se exige acá: hasta que haya pasarela lo marca Estela a mano y un
-- desfasaje dejaría a la persona sin poder completar. Ese gate vive en la app.
create policy health_form_first_time_insert_own on public.health_form_first_time
  for insert
  to authenticated
  with check (private.owns_approved_application(application_id));

-- ---------------------------------------------------------------------------
-- 4. Consentimiento: una sola FK en vez de dos + CHECK
-- ---------------------------------------------------------------------------

alter table public.consents
  add column application_id uuid not null
    references public.applications (id) on delete restrict;

create index consents_application_id_idx on public.consents (application_id);

-- Un consentimiento por solicitud.
create unique index consents_one_per_application_idx
  on public.consents (application_id);

-- ---------------------------------------------------------------------------
-- 5. La vista de estado del postulante
-- ---------------------------------------------------------------------------

-- security_invoker = false (default): corre como dueña de la vista, que es lo
-- que le permite leer tablas donde el usuario no tiene SELECT. El filtro por
-- auth.uid() es lo único que la hace segura, y por eso no se le da a `anon`.
create view public.my_applications
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
  a.reviewed_at
from public.applications a
where a.user_id = (select auth.uid());

revoke all on public.my_applications from anon;
grant select on public.my_applications to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Avisos internos: ahora hay dos momentos que avisar
-- ---------------------------------------------------------------------------

alter table public.admin_notifications
  add column application_id uuid references public.applications (id) on delete cascade;

-- Aviso 1: llegó una solicitud (el filtro corto). Es el que Estela revisa.
--
-- Ojo: la regla de "requiere revisión manual" ahora está partida en dos, porque
-- las respuestas llegan en dos momentos. Acá sólo se conoce el filtro.
-- Espejo en la UI: `needsManualReview` en admin/solicitudes/[id]/page.tsx.
create or replace function private.notify_new_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  trip_title text;
  flags text[] := '{}';
begin
  select t.title into trip_title
  from public.trips t
  where t.id = new.trip_id;

  if new.new_treatment then flags := flags || 'tratamiento médico nuevo'::text; end if;

  insert into public.admin_notifications (
    kind, title, body, href, trip_id, application_id
  )
  values (
    case when array_length(flags, 1) is null
      then 'application_new'::public.admin_notification_kind
      else 'application_health_flag'::public.admin_notification_kind
    end,
    new.full_name || ' se postuló a ' || coalesce(trip_title, 'un viaje'),
    case when array_length(flags, 1) is null
      then 'Solicitud nueva, sin respuestas de salud que marcar.'
      else 'Requiere revisión manual: declara ' || array_to_string(flags, ', ') || '.'
    end,
    '/admin/solicitudes/' || new.id,
    new.trip_id,
    new.id
  );

  return null; -- after trigger: el valor de retorno se ignora
end;
$$;

revoke execute on function private.notify_new_application() from public, anon, authenticated;

create trigger applications_notify
  after insert on public.applications
  for each row
  execute function private.notify_new_application();

-- Aviso 2: se completó el formulario extenso, que llega DESPUÉS de aprobar y
-- pagar. Estela ya dijo que sí, así que esto no es un pedido de revisión salvo
-- que las respuestas marquen algo — y entonces es el aviso más importante de
-- todos, porque la persona ya está adentro.
create or replace function private.notify_health_form()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  app record;
  trip_title text;
  flags text[] := '{}';
begin
  select a.full_name, a.trip_id into app
  from public.applications a
  where a.id = new.application_id;

  select t.title into trip_title
  from public.trips t
  where t.id = app.trip_id;

  if new.health_condition then flags := flags || 'condición de salud'::text; end if;
  if new.substance_use then flags := flags || 'uso de sustancias'::text; end if;
  if new.trauma then flags := flags || 'trauma'::text; end if;

  insert into public.admin_notifications (
    kind, title, body, href, trip_id, application_id
  )
  values (
    case when array_length(flags, 1) is null
      then 'application_new'::public.admin_notification_kind
      else 'application_health_flag'::public.admin_notification_kind
    end,
    app.full_name || ' completó el formulario de salud de ' || coalesce(trip_title, 'un viaje'),
    case when array_length(flags, 1) is null
      then 'Formulario extenso completo, sin respuestas de salud que marcar.'
      else 'Requiere revisión manual: declara ' || array_to_string(flags, ', ') || '.'
    end,
    '/admin/solicitudes/' || new.application_id,
    app.trip_id,
    new.application_id
  );

  return null;
end;
$$;

revoke execute on function private.notify_health_form() from public, anon, authenticated;

create trigger health_form_first_time_notify
  after insert on public.health_form_first_time
  for each row
  execute function private.notify_health_form();
