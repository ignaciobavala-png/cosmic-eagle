-- Retiros vs. ceremonias: decision de docs/CONTENT_MAP.md (2026-07-30), nunca
-- implementada. No son dos tablas ni dos secciones: es un filtro del listado y
-- el desplegable de "Viajes" en el navbar.
--
-- Default 'retiro': los dos viajes que existian al momento de la migracion son
-- de prueba, y el copy del sitio ("Proximos Retiros", el link "Retiros" del
-- footer) venia asumiendo retiro.
create type public.trip_type as enum ('retiro', 'ceremonia');

alter table public.trips
  add column type public.trip_type not null default 'retiro';

-- El listado publico filtra por type + status.
create index trips_type_idx on public.trips (type);
