-- Suscriptores del "Sintoniza" del footer. Hasta ahora el input estaba
-- deshabilitado porque no habia donde guardar los mails.
--
-- Es la primera tabla que escribe `anon`: cualquiera puede suscribirse sin
-- cuenta. Por eso el insert se acota al maximo — solo la columna `email`, con
-- formato validado por constraint — y la lectura queda reservada al admin: la
-- lista de mails no se expone ni a los usuarios logueados.

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_format
    check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint newsletter_subscribers_email_length check (char_length(email) <= 320)
);

-- Unico por mail sin distinguir mayusculas. El server action ya normaliza a
-- minusculas; el indice es la garantia real.
create unique index newsletter_subscribers_email_key
  on public.newsletter_subscribers (lower(email));

alter table public.newsletter_subscribers enable row level security;

create policy newsletter_subscribers_insert_public on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (true);

create policy newsletter_subscribers_select_admin on public.newsletter_subscribers
  for select
  to authenticated
  using ((select private.is_admin()));

-- Grants finos: el revoke a nivel tabla PRIMERO, si no el grant por columna no
-- recorta nada (ver 20260731210000_fix_profiles_is_admin_grant.sql).
revoke all on public.newsletter_subscribers from anon;
revoke all on public.newsletter_subscribers from authenticated;

grant insert (email) on public.newsletter_subscribers to anon;
grant insert (email) on public.newsletter_subscribers to authenticated;
-- SELECT completo para `authenticated`, pero la policy de arriba solo lo deja
-- pasar si es admin.
grant select on public.newsletter_subscribers to authenticated;
