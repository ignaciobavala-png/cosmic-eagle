-- Solicitudes de salud. Una fila por viaje, no un perfil de por vida:
-- un rechazo en un viaje no bloquea aplicar a otro viaje mas adelante.
create type public.application_status as enum ('pending_review', 'approved', 'rejected', 'expired');

create table public.applications_first_time (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete restrict,
  full_name text not null,
  age integer not null check (age > 0),
  height text not null,
  weight text not null,
  country text not null,
  email text not null,
  phone text not null,
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
  status public.application_status not null default 'pending_review',
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index applications_first_time_user_id_idx on public.applications_first_time (user_id);
create index applications_first_time_trip_id_idx on public.applications_first_time (trip_id);
create index applications_first_time_reviewed_by_idx on public.applications_first_time (reviewed_by);

create table public.applications_returning (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete restrict,
  full_name text not null,
  email text not null,
  ceremony_date date,
  new_treatment boolean not null,
  new_treatment_detail text,
  stress_anxiety boolean not null,
  stress_anxiety_detail text,
  theme text not null,
  purpose text not null,
  previous_ceremonies integer not null check (previous_ceremonies > 0),
  status public.application_status not null default 'pending_review',
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index applications_returning_user_id_idx on public.applications_returning (user_id);
create index applications_returning_trip_id_idx on public.applications_returning (trip_id);
create index applications_returning_reviewed_by_idx on public.applications_returning (reviewed_by);

alter table public.applications_first_time enable row level security;
alter table public.applications_returning enable row level security;

-- Datos de salud: solo admin lee/escribe la fila completa.
create policy applications_first_time_admin_all on public.applications_first_time
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy applications_returning_admin_all on public.applications_returning
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- El solicitante puede crear su propia solicitud, pero no releerla despues
-- (ver vistas de solo-estado mas abajo: no exponen datos medicos).
create policy applications_first_time_insert_own on public.applications_first_time
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy applications_returning_insert_own on public.applications_returning
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Vistas de solo-estado para el usuario: expone status/fechas, nunca datos medicos.
-- security_invoker = false (default): corren como dueño de la vista, evitando
-- la ausencia de policy de SELECT propia en la tabla base.
create view public.my_applications_first_time
with (security_invoker = false)
as
select id, trip_id, status, created_at, reviewed_at
from public.applications_first_time
where user_id = (select auth.uid());

create view public.my_applications_returning
with (security_invoker = false)
as
select id, trip_id, status, created_at, reviewed_at
from public.applications_returning
where user_id = (select auth.uid());

grant select on public.my_applications_first_time to authenticated;
grant select on public.my_applications_returning to authenticated;
