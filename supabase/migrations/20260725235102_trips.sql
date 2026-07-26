create type public.trip_status as enum ('draft', 'open', 'closed', 'completed');

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  start_date date not null,
  end_date date not null,
  capacity integer not null check (capacity > 0),
  status public.trip_status not null default 'draft',
  price numeric(10, 2) not null default 0 check (price >= 0),
  created_at timestamptz not null default now(),
  constraint trips_dates_check check (end_date >= start_date)
);

alter table public.trips enable row level security;

-- Lectura publica (landing /viajes es publica, incluye visitantes anonimos).
create policy trips_select_public on public.trips
  for select
  to anon, authenticated
  using (true);

create policy trips_admin_write on public.trips
  for insert
  to authenticated
  with check ((select public.is_admin()));

create policy trips_admin_update on public.trips
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy trips_admin_delete on public.trips
  for delete
  to authenticated
  using ((select public.is_admin()));
