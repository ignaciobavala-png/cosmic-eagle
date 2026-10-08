-- Audio opcional de un articulo (08/10): el guion del video de bienvenida llego
-- con su audio, y la organizacion quiere leerlo y escucharlo en el mismo lugar.
--
-- El archivo vive en `site-assets` (bucket publico, escritura solo admin) bajo
-- `articles/audio/`, igual que las portadas. La URL se lee de `articles`, que
-- es la tabla gateada por nivel: quien no alcanza el nivel no recibe la URL.
-- No se agrega a `articles_public` a proposito.
alter table public.articles add column audio_url text;

-- La trampa del revoke: la tabla tiene grants por columna, asi que una columna
-- nueva que el panel tiene que escribir necesita entrar en ellos.
grant insert (audio_url) on public.articles to authenticated;
grant update (audio_url) on public.articles to authenticated;
