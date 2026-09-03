-- Los campos de logística que pide el boceto de Sofía y necesita el correo [7].
--
-- Vienen pendientes desde el 15/08 (punto 1 de "lo próximo" de esa sesión). Tres
-- de las cuatro variables del correo [7] "Datos finales" —{dirección}, {fecha y
-- hora}, {lista}— no existían como campo, así que ese correo no se podía
-- escribir aunque el motor de envíos ya estuviera.
--
-- ---------------------------------------------------------------------------
-- `location` pasa a ser COLUMNA GENERADA
-- ---------------------------------------------------------------------------
--
-- El boceto pide país y ciudad separados; hoy `location` es texto libre y lo
-- leen cuatro pantallas (home, /viajes, el detalle y TripCard). Partirlo a mano
-- obligaba a tocar las cuatro y a mantener dos fuentes para lo mismo.
--
-- Generada, el nombre y el contenido siguen siendo exactamente lo que eran y
-- ninguna lectura cambia: lo único que cambia es que ya no se escribe.
--
-- **Hace falta `area` para que el texto salga igual que hoy.** Los ocho viajes
-- cargados tienen tres formas ("Tulum, México", "El Arrayán, Santiago, Chile",
-- "Parque Nacional Dos Ojos, Tulum, México"): con sólo ciudad y país, cuatro de
-- ellos perdían el barrio o el paraje, que es justamente lo que ubica al lugar.
--
-- La expresión usa `||` y `coalesce`, **no `concat_ws`**: concat y concat_ws son
-- STABLE (dependen de las funciones de salida de tipo) y Postgres no las acepta
-- en una columna generada, que exige IMMUTABLE.
--
-- ---------------------------------------------------------------------------
-- La política de cancelación NO entra acá
-- ---------------------------------------------------------------------------
--
-- Estaba en la lista y se decidió al revés (Ignacio, 03/09): es la misma para
-- todos los viajes, así que ser columna obligaría a reescribirla en cada carga y
-- a que dos viajes digan cosas distintas por un descuido. Va como slot de
-- `site_content`, editable desde /admin/multimedia. `trips.terms` se queda para
-- lo que sí es por viaje (la seña, el cupo).

-- ---------------------------------------------------------------------------
-- 1. Dónde
-- ---------------------------------------------------------------------------

alter table public.trips
  add column country text,
  add column city text,
  -- Barrio, paraje o zona. Opcional: "Tulum, México" no lleva.
  add column area text,
  -- Dirección exacta. **No es pública**: sale sólo en el correo [7] y en la
  -- pantalla de quien ya está inscripto (las páginas públicas muestran
  -- `location`, que es ciudad y país).
  add column address text,
  add column map_url text,
  add column venue_type text;

-- Backfill desde el texto libre, respetando las tres formas cargadas: el último
-- tramo es el país, el anteúltimo la ciudad y lo que sobra por delante es `area`.
update public.trips
set
  country = trim(split_part(location, ',', array_length(string_to_array(location, ','), 1))),
  city = trim(
    split_part(location, ',', array_length(string_to_array(location, ','), 1) - 1)
  ),
  area = case
    when array_length(string_to_array(location, ','), 1) > 2
      then trim(split_part(location, ',', 1))
  end
where location is not null;

-- Un viaje sin ciudad ni país no se puede publicar ni comunicar, y los ocho
-- cargados ya las tienen. El formulario del panel las pide como obligatorias.
alter table public.trips
  alter column country set not null,
  alter column city set not null;

alter table public.trips drop column location;

alter table public.trips
  add column location text
  generated always as (coalesce(area || ', ', '') || city || ', ' || country) stored;

-- ---------------------------------------------------------------------------
-- 2. Cuándo
-- ---------------------------------------------------------------------------

-- El flyer de las Sesiones dice "11:00 a 21:00" y hasta hoy eso sólo se podía
-- contar dentro del programa. Son la {fecha y hora} del correo [7].
alter table public.trips
  add column start_time time,
  add column end_time time;

-- ---------------------------------------------------------------------------
-- 3. A quién y qué incluye
-- ---------------------------------------------------------------------------

create type public.trip_category as enum ('mixto', 'mujeres', 'hombres', 'avanzados');

alter table public.trips
  add column category public.trip_category not null default 'mixto',
  -- Qué incluye (traslado, comidas, alojamiento). Típico de Viaje, no de Sesión.
  add column includes text,
  -- Llegadas y salidas: cómo se llega, a qué hora conviene, cómo se vuelve.
  add column arrival_notes text,
  -- Qué llevar. Es la {lista} del correo [7].
  add column packing_list text;
