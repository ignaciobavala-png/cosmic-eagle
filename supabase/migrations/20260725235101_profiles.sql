-- Perfiles de usuario + flag de admin.
-- No confundir con auth.users: esta tabla es metadata propia de la app.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Crea el profile automaticamente al registrarse un usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper para policies: corre como security definer, no genera recursion de RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = (select auth.uid())),
    false
  );
$$;

create policy profiles_select_own on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id or (select public.is_admin()));

create policy profiles_update_own on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- is_admin solo se promueve manualmente (SQL/dashboard), nunca por el propio usuario.
revoke update (is_admin) on public.profiles from authenticated;
