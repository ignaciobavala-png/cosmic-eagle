-- El CRM necesita el mail de cada persona registrada y `profiles` no lo tenia:
-- vivia solo en auth.users, que la Data API no expone. Se copia a profiles y se
-- mantiene sincronizado por trigger.
--
-- No hace falta cerrar la columna a mano: la migracion
-- 20260731210000_fix_profiles_is_admin_grant.sql ya revoco UPDATE a nivel tabla
-- y re-otorgo solo (full_name, avatar_url), asi que toda columna nueva nace sin
-- permiso de escritura para `authenticated`.
alter table public.profiles add column email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id;

-- handle_new_user vive en `private` desde 20260725235106 (no debe ser visible
-- por la Data API). El trigger la referencia por OID: replace no lo rompe.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  return new;
end;
$$;

-- Si la persona cambia su mail desde auth, el de profiles queda viejo.
create or replace function private.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.sync_profile_email();
