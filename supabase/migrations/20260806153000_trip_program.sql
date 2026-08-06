-- Programa y condiciones de inscripcion, sacados del flyer que hoy mandan por
-- WhatsApp (ver docs/CEREMONIAS.md): la slide 6 de 8 es una grilla hora +
-- actividad, el precio, y un parrafo con las condiciones de reserva.
--
-- `schedule` es jsonb y no una tabla aparte porque son ~6 filas por viaje que
-- siempre se editan juntas, desde el mismo form del admin: una tabla hija
-- agregaria joins y RLS propia sin ganar nada.
--
-- Forma esperada: [{"time": "11:00", "activity": "Llegada al lugar"}, ...].
-- El CHECK solo garantiza que sea un array; la forma de cada item la valida el
-- server action y la lectura tolera basura (ver src/lib/trip-schedule.ts).
alter table public.trips
  add column schedule jsonb not null default '[]'::jsonb,
  add column terms text;

alter table public.trips
  add constraint trips_schedule_is_array
  check (jsonb_typeof(schedule) = 'array');

comment on column public.trips.schedule is
  'Programa del viaje: array de {time, activity} ordenado por hora.';
comment on column public.trips.terms is
  'Condiciones de inscripcion (sena, reembolso). Texto libre de la clienta.';
