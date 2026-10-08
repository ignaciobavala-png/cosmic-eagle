-- `site-assets` pasa a aceptar audio, para el audio opcional de un articulo
-- (`articles.audio_url`, 08/10). Un .m4a llega como `audio/mp4` o
-- `audio/x-m4a` segun el browser; un .mp3 como `audio/mpeg`.
--
-- El tope de 8MB se deja como esta: el primer audio (8 minutos en AAC) pesa
-- 4,3MB. Una locucion mucho mas larga va a necesitar subirlo o comprimirla.
update storage.buckets
set allowed_mime_types = allowed_mime_types
  || array['audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/mpeg']
where id = 'site-assets';
