-- Casilla de avisos internos del panel de admin.
--
-- Existe porque hoy nada le avisa a Estela: una solicitud nueva sólo se ve si
-- alguien entra a /admin/solicitudes y mira. Y el paso 4 del flujo de
-- inscripción (docs/FLUJO_INSCRIPCION.md) pide explícitamente "generar un aviso
-- interno para revisión" cuando las respuestas de salud son afirmativas.
--
-- Los avisos los escribe un TRIGGER y no el server action a propósito: la
-- solicitud la inserta el postulante, que no es admin y no puede escribir en
-- esta tabla. El trigger es `security definer` justamente para poder hacerlo, y
-- así el aviso existe pase por donde pase el insert (form, seed, SQL a mano).

create type public.admin_notification_kind as enum (
  'application_new',          -- llegó una solicitud
  'application_health_flag',  -- llegó una solicitud que declara salud a revisar
  'email_failed'              -- un mail de la app no salió (lo escribe el código)
);

create table public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  kind public.admin_notification_kind not null,
  title text not null,
  body text,
  -- Link interno del panel. Texto y no ids sueltos porque la ruta depende del
  -- tipo de solicitud y armarla en la UI obligaría a un switch por cada `kind`.
  href text,
  trip_id uuid references public.trips (id) on delete set null,
  application_first_time_id uuid references public.applications_first_time (id) on delete cascade,
  application_returning_id uuid references public.applications_returning (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Estado de lectura GLOBAL, no por admin: son dos o tres personas y todas ven
  -- lo mismo. Si alguna vez hay admins con alcances distintos, esto pasa a ser
  -- una tabla `admin_notification_reads (notification_id, user_id)`.
  read_at timestamptz,
  read_by uuid references auth.users (id) on delete set null
);

create index admin_notifications_unread_idx
  on public.admin_notifications (created_at desc)
  where read_at is null;

alter table public.admin_notifications enable row level security;

-- Los avisos citan datos de salud en el cuerpo: solo admin, en todas las
-- operaciones. No hay policy para el postulante ni para anon.
create policy admin_notifications_admin_all on public.admin_notifications
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Grants por columna. El `revoke` a nivel tabla va primero: si no, el grant por
-- columna no hace nada (ver 20260731210000_fix_profiles_is_admin_grant.sql).
-- El admin solo marca como leído; el resto de las columnas las escribe el
-- trigger o el server action que corre con su propia sesión.
revoke update on public.admin_notifications from authenticated;
grant update (read_at, read_by) on public.admin_notifications to authenticated;

-- Aviso por solicitud nueva.
--
-- `security definer` para saltear la RLS de arriba: quien dispara el trigger es
-- el postulante. `set search_path = ''` es obligatorio en definer, si no un
-- schema en el path del invocador puede secuestrar los nombres sin calificar.
create or replace function private.notify_new_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  trip_title text;
  slug text;
  flags text[] := '{}';
begin
  select t.title into trip_title
  from public.trips t
  where t.id = new.trip_id;

  -- Mismo criterio que el cartel "Requiere revisión manual obligatoria" del
  -- detalle (`needsManualReview` en admin/solicitudes/[type]/[id]/page.tsx).
  -- Si cambia allá, cambia acá: son la misma regla escrita dos veces porque una
  -- corre en Postgres y la otra en React.
  if tg_table_name = 'applications_first_time' then
    slug := 'primerizo';
    if new.health_condition then flags := flags || 'condición de salud'::text; end if;
    if new.substance_use then flags := flags || 'uso de sustancias'::text; end if;
    if new.trauma then flags := flags || 'trauma'::text; end if;
  else
    slug := 'recurrente';
    if new.new_treatment then flags := flags || 'tratamiento médico nuevo'::text; end if;
  end if;

  insert into public.admin_notifications (
    kind, title, body, href, trip_id,
    application_first_time_id, application_returning_id
  )
  values (
    case when array_length(flags, 1) is null
      then 'application_new'::public.admin_notification_kind
      else 'application_health_flag'::public.admin_notification_kind
    end,
    new.full_name || ' se postuló a ' || coalesce(trip_title, 'un viaje'),
    case when array_length(flags, 1) is null
      then 'Solicitud ' || slug || ', sin respuestas de salud que marcar.'
      else 'Requiere revisión manual: declara ' || array_to_string(flags, ', ') || '.'
    end,
    '/admin/solicitudes/' || slug || '/' || new.id,
    new.trip_id,
    case when tg_table_name = 'applications_first_time' then new.id end,
    case when tg_table_name = 'applications_returning' then new.id end
  );

  return null; -- after trigger: el valor de retorno se ignora
end;
$$;

-- Solo el owner ejecuta la función: siendo `security definer`, dejarla abierta
-- a `authenticated` permitiría llamarla fuera del trigger.
revoke execute on function private.notify_new_application() from public, anon, authenticated;

create trigger applications_first_time_notify
  after insert on public.applications_first_time
  for each row
  execute function private.notify_new_application();

create trigger applications_returning_notify
  after insert on public.applications_returning
  for each row
  execute function private.notify_new_application();
