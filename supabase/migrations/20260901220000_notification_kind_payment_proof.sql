-- Un aviso más para la casilla del panel: el postulante subió un comprobante.
--
-- Va en su propia migración a propósito. `alter type ... add value` no se puede
-- USAR en la misma transacción en la que se agrega, y cada migración corre en
-- una transacción: la tabla, el trigger y todo lo que escribe este valor viven
-- en la migración siguiente.
alter type public.admin_notification_kind add value if not exists 'payment_proof';
