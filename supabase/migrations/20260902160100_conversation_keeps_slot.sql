-- "Conversemos" mantiene la solicitud VIVA.
--
-- `applications_one_active_per_trip_idx` es un indice unico parcial sobre
-- (user_id, trip_id) que solo mira los estados vivos. Sin este cambio,
-- `needs_conversation` caeria fuera del indice y la persona podria mandar una
-- segunda solicitud al mismo viaje mientras la conversacion esta abierta: se
-- duplicaria el caso justo en el que hay algo delicado que mirar, y Estela
-- terminaria revisando dos veces a la misma persona.
--
-- Un rechazo o un vencimiento siguen fuera a proposito: esos si liberan el
-- cupo para volver a postularse mas adelante.

drop index public.applications_one_active_per_trip_idx;

create unique index applications_one_active_per_trip_idx
  on public.applications (user_id, trip_id)
  where status in ('pending_review', 'needs_conversation', 'approved');
