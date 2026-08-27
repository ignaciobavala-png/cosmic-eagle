-- El bucket `site-assets` pasa a aceptar video, para que la clienta pueda subir
-- los clips cortos de fondo desde /admin/multimedia (los heros y las pantallas
-- de frase que el rediseño de Julia pide en video).
--
-- Dos cosas a la vez:
--
-- 1. `allowed_mime_types` suma `video/webm` y `video/mp4`. WebM es lo que sale
--    del compresor del browser; MP4 se acepta porque es lo que va a llegar si el
--    navegador no pudo comprimir y sube el original.
-- 2. El tope por archivo pasa de 5 MB a 8 MB. El compresor deja un clip de 5-10
--    segundos en ~1-2 MB; los 8 MB son la red de contencion para cuando la
--    compresion no corre y sube el original.
--
-- Ojo con el free tier: no es el 1 GB de storage el que aprieta (un clip pesa
-- ~1,5 MB), sino los **5 GB de egress al mes**. Un video de 1,5 MB en el hero de
-- la home se descarga en cada visita: ~3.300 visitas y se acaba la cuota. Por eso
-- el compresor apunta a 720p y el panel avisa el peso final.
--
-- La policy de escritura no cambia: sigue siendo solo admin.

update storage.buckets
set
  allowed_mime_types = array[
    'image/jpeg','image/png','image/webp','image/avif','image/gif',
    'video/webm','video/mp4'
  ],
  file_size_limit = 8388608
where id = 'site-assets';
