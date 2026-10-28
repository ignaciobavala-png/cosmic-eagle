# Envío material

> Origen: la organización mandó (28/10) el **cuaderno de preparación de Egipto**
> como PDF de ejemplo (`docs/entregas/2026-10-28-texto-egipto/`) y pidió poder
> generar comunicaciones con ese mismo formato. Primera versión: 28/10.

## Qué es

Una sección del panel (`/admin/material`, grupo **Comunicación**) donde la
clienta arma un documento —tapa, capítulos, texto, frases destacadas, listas,
fotos— y se genera solo con el formato del PDF de referencia. Se comparte por
**link** y se puede guardar como PDF desde el navegador.

**Una sola plantilla, estricta.** El formato del PDF no es "inspiración": es lo
que se dibuja. No hay selector de plantillas.

## El formato, extraído del PDF

| Pieza | En el PDF | Cómo se dibuja |
|---|---|---|
| Tapa / contratapa | A4 vertical a sangre (1241×1754). **El logo viene dentro de la imagen**; el título va encima, en dorado | imagen del documento + `eyebrow` y título como texto |
| Imagen **banner** | 16:9 a 2:1, ancho completo | bloque `imagen`, `kind: banner`, recorte 16:9 |
| Imagen **perfil** | 3:4, dentro de la columna | `kind: perfil`, recorte 3:4 |
| Imagen **cuadrada** | 1:1 (una sola vez en el PDF) | `kind: cuadrada` |
| Capítulo | serif grande, **arranque en negrita** + resto normal; "Parte I" chico arriba | bloque `capitulo` (`parte` / `titulo` / `resto`) |
| Cuerpo | sans chica, **dos columnas** | bloque `texto` (`columnas: 2 \| 1`), `**negrita**` inline |
| Frase destacada | serif grande dentro de la columna | bloque `destacado` |
| Lista | viñetas | bloque `lista`, un ítem por línea |
| Índice | con números de página | índice con **links** (en la web no hay páginas) |

Tipografía: **Georgia** (títulos, del sistema, con cascada) y **Quattrocento Sans**
(cuerpo, Google Fonts vía `next/font`). Son las del PDF, que salió de un `.docx`;
no son las del sitio ni las del manual de marca.

## Cómo funciona

- **Datos:** tabla `materiales` (admin-only por RLS), con los bloques en `jsonb`.
  **Nunca HTML**: la clienta elige tipos de bloque y escribe texto; no hay
  sanitizador en el proyecto. `parseMaterialBlocks` valida todo lo que entra
  (descarta tipos desconocidos, limita largos, acepta imágenes sólo de nuestro
  bucket bajo `material/`).
- **Dibujo:** `components/material/MaterialDocument.tsx`, presentacional y sin
  hooks: lo usan la página pública (Server Component) y la vista previa del
  panel (cliente).
- **Imágenes:** se comprimen y recortan **en el browser** (`compressImage`, a la
  proporción de cada tipo) y suben **directo a Storage** (`site-assets`, prefijo
  `material/`), como `AudioField`: nada de fotos por el cuerpo del server action
  (tope de ~4,5 MB en Vercel). Al guardar se borran las que el documento dejó de
  usar. Si se sube y se cancela queda un huérfano (mismo costo que el audio).
- **Link:** `share_token` en la propia fila (a diferencia de `article_shares`: acá
  la tabla no la lee `anon`). Se lee por `shared_material(token)`, `security
  definer`. Página `/material/<token>`: **dinámica** (si cacheara, "Dejar de
  compartir" no cortaría el link), `noindex`, **sin header ni footer**. Un token
  inexistente o quitado da 404.
- **PDF:** botón "Guardar como PDF" = `window.print()`. Hoja A4, cada capítulo
  en página nueva, numeración abajo a la derecha.

## Trampas de la impresión (costaron una tarde)

- **Márgenes distintos entre páginas = texto cortado.** Una `@page cover` con
  `margin: 0` y el resto con margen hace que Chromium maquete a un ancho y
  recorte al otro. Todas las páginas llevan el **mismo margen**; la página con
  nombre sólo apaga el número.
- **No se puede sacar una imagen "a sangre" desbordando el área de contenido**:
  Chromium recorta todo lo que sale de ella (y el desborde de la contratapa se
  filtraba como una tira en la página anterior). **En el PDF la tapa ocupa el
  área de contenido, con margen blanco**; en pantalla y por link sí va a sangre.
- El reset de Tailwind le pone `max-width: 100%` a los `<img>`: un `width` en
  impresión no pasa de ahí sin `max-width: none`.
- Las reglas del `<style>` del componente van **sin capa** y le ganan a las
  utilidades de Tailwind (que van en `@layer`): no hace falta `!important`.

## Fuera de esta versión (pedido, pero después)

1. **"Enviar a contenidos"** con selector de categoría. El documento se guarda en
   bloques justamente para poder derivar el artículo. Ojo: según el pedido, en
   Contenidos **también** tiene que verse con este formato, así que
   `/contenidos/[slug]` tendría que poder dibujar `MaterialDocument` además de
   `ArticleBody`.
2. **Pop-up de envío por correo**, con casillas segmentadas por viaje. Ya existe
   la base: `SendEmailPanel` / `sendSegmentedEmail` en el CRM (máx. 80 por envío,
   600 ms entre mails, plantilla `MensajeEquipo`). Hay que decidir quién entra en
   cada grupo (¿sólo aprobadas?) y la baja para suscriptores.
3. **WhatsApp + IA** (el objetivo que más les interesa): proyecto aparte. Que el
   documento sea bloques estructurados es lo que lo deja listo como base de
   conocimiento.

## Verificación

`e2e/material.escritura.spec.ts`: arma un documento con dos fotos reales,
comprueba la vista previa, guarda, reabre, comparte, lo abre **sin sesión**
(`noindex`, sin chrome del sitio), prueba un token falso (404) y corta el link.
Escribe en producción con prefijo `E2E` y limpia fila + archivos. Si una corrida
falla antes de guardar, las fotos subidas quedan huérfanas en `material/`.
