-- 14/10: testimonios en /contenidos. Un valor de enum no se puede USAR en la
-- misma transaccion en que se agrega, asi que va solo en su migracion.
alter type public.testimonial_placement add value if not exists 'contenidos';
