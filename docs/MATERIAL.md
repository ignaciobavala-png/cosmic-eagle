# Envío material (HTML subido)

**29/10/2026.** El editor de bloques del 28/10 (formato del cuaderno de Egipto)
no le sirvió a la organización: no tienen tiempo de armar el documento en el
panel. Lo reemplazó **subir un HTML ya hecho** en su computadora.

## Qué hay

- **`/admin/material`**: título + archivo `.html` (hasta 3MB). "Compartir" saca
  un link `/material/<token>` que abre sin cuenta, sin indexar. "Dejar de
  compartir" lo corta en el acto (la página es dinámica a propósito).
- **Contenidos** (`/admin/contenidos`): el formulario tiene el selector
  *Formato del contenido* (`Texto` / `HTML subido`). El HTML se guarda en
  `articles.body` con `body_format = 'html'`, así el nivel de acceso, el muro y
  los links con token (`/compartido/<token>`) funcionan igual que con un texto.
  Un HTML no tiene versión en inglés (`body_en` se anula); título y bajada sí.
- **Botón Compartir** al lado de "Volver a la biblioteca" en
  `/contenidos/[slug]` (`ShareButton`): menú nativo en el teléfono, o copia la
  dirección pública. No es el link con token del admin.

## La regla de seguridad

**No hay sanitizador en el proyecto.** Lo que protege es el aislamiento:
`HtmlFrame` dibuja el HTML en un `<iframe sandbox="allow-scripts allow-popups …">`
**sin `allow-same-origin`** (origen opaco: el script no lee cookies ni toca la
sesión). **No agregar `allow-same-origin`.** El alto se resuelve con un script
que se inyecta antes de `</body>` y avisa por `postMessage`.

## Trampas

- Un server action de Vercel acepta ~4.5MB de cuerpo; el tope es 3MB. Las fotos
  embebidas en base64 pesan un tercio más: hay que comprimirlas antes de exportar.
- Las rutas relativas del HTML (`img/foto.jpg`) no resuelven: un iframe `srcdoc`
  no tiene carpeta. Las imágenes van embebidas o con URL pública.
- `articles` tiene grants por columna: `body_format` entró al grant en su
  migración (`20261029140000_html_subido.sql`).
- `shared_article` y `shared_material` se recrearon (cambió el tipo de retorno).

## El editor viejo

Se descartó del todo el 29/10: se borraron los 2 documentos de prueba, las 6
imágenes de `site-assets/material/` y las columnas `blocks`, `eyebrow` y las
tapas (`20261029150000_materiales_solo_html.sql`). `materiales.html` es
obligatorio.
