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
