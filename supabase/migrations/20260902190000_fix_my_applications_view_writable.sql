-- ESCALADA DE PRIVILEGIOS: se podia escribir la tabla `applications` a traves
-- de la vista `my_applications`, salteando la RLS.
--
-- La vista es `security_invoker = false` (o sea, definer) A PROPOSITO: el
-- postulante NO tiene SELECT sobre `applications` —ahi viven sus respuestas de
-- salud y los campos de revision— y la vista es justamente lo que le muestra su
-- propio estado sin exponer el resto. Con invoker devolveria cero filas.
--
-- Lo que se paso por alto es que una vista definer no solo LEE como su dueño:
-- tambien ESCRIBE como su dueño. Y esta vista es auto-actualizable (un solo
-- FROM, sin agregados en la lista de seleccion), es propiedad de `postgres`, y
-- Supabase le da por defecto `grant all` a `anon` y `authenticated` sobre todo
-- lo que hay en `public`.
--
-- Verificado antes del fix, con `set role` sobre una solicitud de prueba:
--   update applications    set status='approved' ...  ->  0 filas (RLS lo frena)
--   update my_applications set status='approved',
--                              payment_status='paid'  ->  1 fila  (PASO)
--
-- O sea que cualquier postulante logueado podia auto-aprobarse y marcarse como
-- pagado con un PATCH a /rest/v1/my_applications desde el browser, salteando la
-- revision de Estela y el pago entero, y habilitandose la etapa 2.
--
-- Es el mismo error que el de 20260731210000 (`profiles.is_admin`): dar por
-- hecho que la RLS de la tabla base alcanza. Ahi el agujero era un `revoke` por
-- columna que no hacia nada; aca es una vista que puentea la RLS.
--
-- El fix es acotado: la vista es de SOLO LECTURA. No hay ningun camino en la app
-- que escriba a traves de ella —el postulante inserta en `applications` y en las
-- tablas hijas directamente, y el admin actualiza la tabla base—, asi que
-- revocar la escritura no rompe nada.
--
-- REGLA GENERAL: toda vista `security definer` en un schema expuesto tiene que
-- quedar con SELECT y nada mas. Si alguna vez hace falta escribir por una vista,
-- va con `security_invoker = true` o con un trigger INSTEAD OF que chequee.
--
-- OJO CON EL ORDEN: esta migracion va DESPUES de
-- 20260902180200_my_applications_amount_paid.sql, que recrea la vista. Esa usa
-- `create or replace` (que conserva los grants) y cierra a `anon` con
-- `revoke all`, pero a `authenticated` solo le AGREGA select: los grants de
-- escritura que Supabase da por defecto le quedaban igual. Cualquier migracion
-- futura que vuelva a tocar la vista tiene que terminar con este mismo revoke.

revoke insert, update, delete, truncate, references, trigger
  on public.my_applications from anon, authenticated;

-- Explicito, para que se lea la intencion (el SELECT de `anon` ya estaba
-- revocado desde 20260819180444; se repite el revoke por si acaso).
revoke select on public.my_applications from anon;
grant select on public.my_applications to authenticated;
