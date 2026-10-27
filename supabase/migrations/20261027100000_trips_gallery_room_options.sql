-- Retiros: galería del lugar (3+ imágenes) y tipos de habitación con precio
-- (pedido de Sofía, 27/10). Sólo se muestran en el detalle público; el precio
-- que cobra el embudo sigue siendo `trips.price`.
alter table public.trips
  add column if not exists gallery text[] not null default '{}',
  add column if not exists room_options jsonb not null default '[]'::jsonb;

comment on column public.trips.gallery is
  'URLs públicas (bucket trip-images) de las fotos del lugar, en orden.';
comment on column public.trips.room_options is
  'Lista [{"label": text, "price": number}] de tipos de habitación; vacía si no aplica.';
