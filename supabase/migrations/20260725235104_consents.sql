create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete restrict,
  application_first_time_id uuid references public.applications_first_time (id) on delete restrict,
  application_returning_id uuid references public.applications_returning (id) on delete restrict,
  date date not null default current_date,
  confirmations jsonb not null,
  digital_signature text not null,
  consent_version text not null,
  created_at timestamptz not null default now(),
  constraint consents_application_ref_check check (
    (application_first_time_id is not null and application_returning_id is null)
    or (application_first_time_id is null and application_returning_id is not null)
  )
);

create index consents_user_id_idx on public.consents (user_id);
create index consents_trip_id_idx on public.consents (trip_id);
create index consents_application_first_time_id_idx on public.consents (application_first_time_id);
create index consents_application_returning_id_idx on public.consents (application_returning_id);

alter table public.consents enable row level security;

create policy consents_select_own on public.consents
  for select
  to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy consents_insert_own on public.consents
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy consents_admin_all on public.consents
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
