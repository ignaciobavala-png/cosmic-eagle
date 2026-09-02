-- Link de pago por viaje.
--
-- Encuadrado no es una reserva de agenda sino un LINK DE PAGO suelto, uno por
-- viaje (relevado el 02/09 con las capturas de Ignacio, ver docs/ENCUADRADO.md
-- §8). Su API publica tiene DOS endpoints —listar horarios y crear una reserva—
-- y los dos reciben un `service_uuid` que ya tiene que existir: no hay forma de
-- crear el servicio desde nuestro panel, asi que la URL se pega a mano.
--
-- Por que aca y no en `payment_methods.link_url`: ese riel es UNO para todo el
-- sitio, y este link lleva el precio de UN viaje adentro. Cargado alla, todos
-- los viajes cobrarian el importe del primero.
alter table public.trips
  add column payment_url text
    constraint trips_payment_url_https
      check (payment_url is null or payment_url ~ '^https://[^ ]+$');

comment on column public.trips.payment_url is
  'Link de pago externo (hoy Encuadrado) para este viaje. Lo pega el admin: la API de Encuadrado no crea servicios. Null = este viaje se cobra solo por transferencia.';

-- Sin grants nuevos: `trips` tiene los permisos a nivel TABLA, asi que una
-- columna nueva los hereda sola. Queda legible por `anon`, y esta bien: el link
-- de Encuadrado es una URL publica y compartible por diseno — ella misma la
-- manda por WhatsApp. Lo que protege de que alguien pague sin estar aprobado no
-- es el secreto de la URL sino donde se la muestra, y el boton vive solo en la
-- pantalla del aprobado.
