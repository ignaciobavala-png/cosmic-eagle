-- La sena como estado de pago propio.
--
-- Sofia confirmo (02/09) las dos primeras preguntas de
-- docs/consulta-sofia-pagos.txt: se ofrecen las DOS opciones —reservar con una
-- sena o pagar el total— y el monto de la sena lo definen ellas, viaje por
-- viaje. Eso es lo que pedian los correos [2], [3] y [3A] del documento de
-- comunicaciones (docs/COMUNICACIONES.md).
--
-- `payment_status` era un booleano con excepcion (pending | paid | waived) y no
-- podia representar "reservado": ni el cupo estaba sin pagar ni la inscripcion
-- estaba completa. `deposit_paid` es ese medio.
--
-- Va entre `pending` y `paid` porque es el orden del recorrido.
--
-- Ojo con el enum: `alter type ... add value` no se puede USAR en la misma
-- transaccion en la que se agrega, y cada migracion corre en una. Las columnas
-- van en la migracion siguiente. Mismo caso que `needs_conversation` (hoy) y
-- que `payment_proof` (01/09).

alter type public.payment_status add value 'deposit_paid' after 'pending';
