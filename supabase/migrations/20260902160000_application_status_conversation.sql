-- Tercer resultado de revision: "conversemos".
--
-- Sale del documento "Comunicaciones al Viajero - Orden Cronologico" que mando
-- Sofia el 26/08 (ver docs/COMUNICACIONES.md, correo [2A]). Hasta hoy la
-- revision tenia dos salidas —aprobada o rechazada— y el encuadre del filtro
-- corto dice que "nada de lo que nos cuentes cierra la puerta de entrada": una
-- solicitud que menciona una enfermedad, un tratamiento o una medicacion no es
-- un rechazo, es una conversacion pendiente.
--
-- Eso ya existia a medias: el trigger `private.notify_new_application` levanta
-- un aviso interno cuando el filtro trae banderas de salud. Pero ese aviso
-- moria en el panel, y la persona del otro lado quedaba en "en revision" sin
-- saber nada. Este estado es el mismo hecho, pero visible para las dos partes.
--
-- Ojo con el enum: `alter type ... add value` no se puede USAR en la misma
-- transaccion en la que se agrega, y cada migracion corre en una. Por eso este
-- archivo agrega el valor y nada mas; el indice que lo usa va en la migracion
-- siguiente. Mismo caso que `payment_proof` en admin_notification_kind.

alter type public.application_status add value 'needs_conversation' after 'pending_review';
