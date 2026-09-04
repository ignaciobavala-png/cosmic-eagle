-- País de residencia en el filtro corto.
--
-- Pedido de Estela en la reunión del 2026-09-04 ("agregar pregunta 'país de
-- residencia'"). Va en la etapa 1 y no en el formulario de salud por lo mismo
-- que el nombre, el mail y el teléfono: lo llenan TODOS, y Estela necesita
-- saber desde dónde viaja la persona antes de aprobarla, no después de que
-- pagó. El extenso ya pregunta el país de ORIGEN (`health_form_first_time.
-- country`), que es otra cosa y sigue donde está.
--
-- `not null` sin default: la tabla está en cero filas y el formulario lo pide
-- como obligatorio. Un default vacío sólo serviría para dejar entrar filas sin
-- el dato.
--
-- No hace falta tocar los grants: el INSERT de `authenticated` es a nivel
-- tabla, así que alcanza a la columna nueva. El UPDATE sigue revocado (la
-- migración de dos etapas sólo devolvió las columnas de la revisión), o sea
-- que la respuesta queda inmutable como el resto del filtro.
alter table public.applications
  add column residence_country text not null;

comment on column public.applications.residence_country is
  'País donde vive la persona hoy. Distinto del país de origen del formulario extenso.';
