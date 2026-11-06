-- Moneda de cada experiencia (pedido de la organización, 06/11): pesos chilenos,
-- dólares o euros. Hasta hoy todo era USD (`formatAmount` lo escribía fijo); el
-- default conserva eso para las experiencias ya cargadas.
alter table public.trips
  add column currency text not null default 'USD'
  check (currency in ('CLP', 'USD', 'EUR'));

-- El revoke de columnas de `trips` pasa por grants a nivel de columna (ver la
-- trampa de CLAUDE.md): si `trips` los tiene, la columna nueva tiene que entrar.
do $$
begin
  if exists (
    select 1 from information_schema.column_privileges
    where table_schema = 'public' and table_name = 'trips'
      and grantee = 'authenticated' and privilege_type = 'UPDATE'
      and column_name = 'price'
  ) and not exists (
    select 1 from information_schema.table_privileges
    where table_schema = 'public' and table_name = 'trips'
      and grantee = 'authenticated' and privilege_type = 'UPDATE'
  ) then
    grant update (currency) on public.trips to authenticated;
    grant insert (currency) on public.trips to authenticated;
  end if;
end $$;
