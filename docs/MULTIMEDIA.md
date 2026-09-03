# Multimedia — imágenes y textos editables desde el admin

Sección `/admin/multimedia`. Permite a Estela y a Sofía cambiar las imágenes y
los textos de las páginas públicas sin tocar el código ni deployar.

Nació de independizar el frontend del backend: si la diseñadora no continúa, el
contenido tiene que poder moverse sin ella.

## Cómo está armado

**El código declara qué slots existen; la base solo guarda los overrides.**

- Registro: `src/lib/site-content.ts` (`SITE_GROUPS`) — key, etiqueta humana,
  ayuda, tipo (`text` / `multiline` / `image`), valor por defecto y, para
  imágenes, proporción y lado máximo.
- Tabla `site_content` (`key` → `value`), migración
  `20260812150000_site_content.sql`. Una fila que no matchea ningún slot del
  registro se ignora sola.
- Bucket `site-assets`, público para leer por URL, escritura solo admin.

Consecuencias buscadas:

| Situación | Qué pasa |
|---|---|
| Sección nueva | Se agregan las entradas al registro y el panel las lista solo: sin migración ni tocar la UI del admin |
| Slot renombrado o borrado | La fila vieja queda huérfana y se ignora; nunca rompe |
| Base caída o cache frío | Renderiza el valor del repo |
| Cambia un `fallback` en código | **El override sigue ganando.** Por eso el panel marca los slots editados y ofrece "volver al original" |

## Detalles que no son obvios

- **La lectura no usa el cliente con cookies.** `unstable_cache` no admite leer
  `cookies()` dentro del scope cacheado, así que `site-content.ts` arma un
  cliente anon sin sesión. El contenido es público (policy
  `site_content_select_public`), no necesita la sesión del visitante.
- **`updateTag`, no `revalidateTag`.** El segundo sirve el valor viejo mientras
  revalida en background; acá la clienta guarda y mira el resultado en el acto.
  Además va `revalidatePath` del grupo, porque `/nosotros` es estática y con el
  tag solo seguiría sirviendo el HTML viejo.
- **Nombre nuevo de archivo en cada subida** (`{key}/{uuid}.webp`). Con un path
  fijo por slot la URL no cambia y el CDN sigue sirviendo la imagen anterior
  después de reemplazarla.
- **Se borra el asset anterior al reemplazar.** Sin eso cada corrección deja el
  archivo viejo para siempre, que es el verdadero riesgo de llenar el free tier
  (no la cantidad de assets).
- **La key llega del form pero se valida contra el registro** (`isSlotKey`): no
  se escribe una key arbitraria aunque se manipule el HTML.
- **La compresión corre en el browser** (`src/lib/compress-image.ts`): WebP,
  redimensionado al `maxPx` del slot, y si falla sube el original en vez de
  romper. El input recibe el archivo comprimido vía `DataTransfer` antes del
  submit. De yapa, pasar por canvas borra el EXIF (incluida la geolocalización).

## Portadas de viaje (agregado el 2026-08-18)

La última sección del panel es **"Portadas de viajes"**, y es la única que **no
sale del registro de slots**: las portadas viven en `trips.image_url` y en el
bucket `trip-images`, no en `site_content`.

Está ahí igual porque para la clienta es "una imagen del sitio" y no tiene por qué
saber que se guarda en otra tabla. Antes la única forma de cargarla era entrar a
editar el viaje.

- Lista todos los viajes ordenados por fecha, con su portada actual o "Sin portada".
- Recorta a **16:9 en el browser** antes de subir y muestra la zona segura sobre la
  preview, igual que el form del viaje. Las dos pantallas comparten
  `src/lib/trip-cover.ts` — se extrajo justamente para no tener dos caminos de
  subida que se separen con el tiempo. Ver `docs/PORTADAS.md`.
- El cliente manda solo el `trip_id`: la URL de la portada que se reemplaza (y se
  borra del bucket) la relee el server de la base.
- No usa `updateTag` porque no toca `site_content`: revalida las rutas donde se ve
  la portada (`/`, `/viajes`, el detalle y el propio panel).

## La página es un acordeón (2026-08-18)

Cada grupo es un `<details>` nativo, no un acordeón con estado de React: sin JS,
accesible por teclado, y el navegador se encarga de todo. Con 16 slots más la
lista de viajes, todo abierto era una tira de scroll.

Abre solo el primer grupo. El renglón chico bajo cada título dice cuántos
elementos tiene y cuántos están editados, para no tener que abrirlo a ver.

## Cuentas del free tier (medidas el 2026-08-12)

- Buckets `avatars` y `trip-images`: 0 objetos. DB: 11 MB de 500 MB.
- Los 8 assets de Julia enteros pesan 836 KB (promedio 105 KB por WebP).
- A ese peso, 1 GB son ~6.800 imágenes. El storage no es el límite que aprieta.
- El cuello sería el egress (5 GB/mes), mitigado porque `next/image` cachea la
  versión transformada en el CDN de Vercel: Supabase sirve cada imagen una vez
  por transformación, no una vez por visita. **Ojo**: eso se pierde si una ruta
  nueva sirve las imágenes del bucket con `<img>` crudo.

## Slots cubiertos hoy

Inicio (portada + los tres portales + sus textos), Nosotros (portada + las dos
imágenes de los bloques + textos de portada), Viajes (portada).

Falta llevar al registro el copy de las secciones que siguen mock
(`AboutSection`, `EbookSection`, `TestimonialsSection`) — conviene hacerlo
cuando se rediseñen, no antes, porque el texto va a cambiar de forma.

## Colores

**Decidido no hacer un editor de colores libre.** Los tokens ya son custom
properties en `globals.css`, así que técnicamente se pueden pisar en runtime,
pero son ~50 con relaciones internas (`on-primary` existe para contrastar contra
`primary`) y el fondo no es un token sino un degradé más cinco capas de
estrellas. Si hace falta, el camino es **presets de paleta completos definidos en
código**, no cincuenta color pickers.

## Videos (27/08/2026)

El panel acepta **video además de imagen** en los espacios que en el diseño
ocupan la pantalla entera (los heros y las pantallas de frase). El slot no
cambia: sigue guardando **una sola URL**, y el renderer decide si dibuja un
`<Image>` o un `<video>` mirando la extensión (`src/lib/media.ts`). Para la
clienta eso significa que puede pasar de foto a video y volver, en el mismo
lugar, sin que haya que tocar código.

Qué slots lo aceptan: los marcados con `video: true` en el registro. Un video en
una foto chica no aporta nada y gasta egress, así que no se habilita en todos.

### Se comprime en el browser, y por qué así

`src/lib/compress-video.ts` re-codifica el clip dibujándolo en un `<canvas>` y
grabando ese canvas con `MediaRecorder`. Sale WebM a 720p, ~1,2 Mbps y **sin
audio** (son fondos que se reproducen en silencio; la pista sería peso puro).

- **No se usa `ffmpeg.wasm`**: son ~25 MB de descarga para que la clienta suba un
  clip de cinco segundos.
- **La contra es que corre en tiempo real**: un clip de 8 segundos tarda 8
  segundos en comprimirse. Por eso hay un tope de **40 segundos**, con un mensaje
  que lo explica, en vez de dejarla esperando sin saber por qué.
- Si el navegador no soporta `MediaRecorder`, si el codec falla o si el original
  ya venía más liviano, **sube el original**. Mismo criterio que `compressImage`:
  peor que comprimido, mejor que un error que ella no puede resolver.

### El límite real del free tier no es el storage

Un clip comprimido pesa ~1,5 MB y el free tier da 1 GB: por ahí no aprieta. Lo
que aprieta son los **5 GB de egress al mes**, porque un video de fondo se
descarga en **cada visita**. A 1,5 MB son ~3.300 visitas mensuales; el mismo
tráfico con la imagen de 190 KB serían 26.000. Si el sitio empieza a recibir
visitas de verdad, el hero en video es lo primero que hay que mirar.

El bucket `site-assets` quedó en 8 MB por archivo y con `video/webm` y
`video/mp4` habilitados (migración `20260827210000_site_assets_video.sql`). El
tope de 8 MB es la red de contención para cuando la compresión no corre.

### En el sitio

`BackgroundMedia` es el único lugar que decide imagen vs. video. El video va
`muted` + `playsInline` (sin las dos cosas el autoplay no arranca en mobile),
`loop`, `preload="metadata"` y `aria-hidden` — es decoración, no contenido. En el
hero, además, **el zoom lento no se aplica cuando lo cargado es un video**: el
clip ya tiene su propio movimiento.

## Grupo "Condiciones" (03/09)

Un solo slot, `condiciones.cancelacion`, de tipo `multiline`: la **política de
cancelación**, que se muestra al pie de la página de cada experiencia.

Es la única cosa del panel que reemplaza a un campo que iba a ser de `trips`. Se
decidió así (Ignacio, 03/09) porque la política es la misma para todas: como
columna, había que reescribirla en cada carga y dos experiencias iban a terminar
diciendo cosas distintas por un descuido. `trips.terms` se quedó para lo que sí
cambia entre una y otra (la seña, los requisitos).

**Sale vacío a propósito**: el texto es de la clienta, igual que las FAQs. Sin
texto cargado, la sección no se dibuja en ninguna página.
