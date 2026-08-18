# Contenidos — artículos editables desde el panel

Fecha: 2026-08-18. `/contenidos` dejó de ser la sección mock que se había mudado
de la home: ahora es un listado real, alimentado por la tabla `articles`, que
Estela y Sofía cargan desde `/admin/contenidos`.

## Qué se puede cargar

Por artículo: **título**, **dirección** (el slug de la URL), **bajada**,
**portada**, **categoría**, **estado** y el **texto**.

- **Estado**: `draft` (nadie más lo ve) o `published`. Es el interruptor con el
  que se escribe tranquila y se publica cuando está listo.
- **Categoría**: Biblioteca, Ciencia Almática o Testimonios — las tres del hub
  que definió `docs/CONTENT_MAP.md`. Son un enum, no texto libre: son la
  navegación de la página, no una etiqueta suelta.
- **Texto**: texto plano con dos reglas y nada más — línea en blanco = párrafo
  nuevo, línea que empieza con `## ` = subtítulo.

## Decisiones

**Tabla y no constantes tipadas.** `docs/CONTENT_MAP.md` decía que 20 recursos no
justificaban CRUD ni CMS. Lo que cambió el criterio no es la cantidad: es que el
pedido explícito es que la clienta **cargue contenido sin tocar código**. Un
archivo de constantes obliga a un deploy por cada texto.

**No es `site_content`.** Multimedia sirve para slots que **el código declara**
(la portada de la home es una y siempre está). Acá la cantidad de artículos la
decide la clienta, así que necesita filas propias con id, slug y estado.

**Nada de markdown ni editor rico.** El cuerpo se renderiza a `<p>` y `<h2>` con
el texto como texto, nunca como HTML. Aceptar HTML de un formulario y volcarlo en
una página pública es un XSS almacenado, y en el proyecto no hay sanitizador. Las
dos reglas (`línea en blanco`, `## `) cubren lo que un artículo necesita.

**El borrador no sale de la base.** La policy pública es
`using (status = 'published')` y hay una segunda policy para que el admin vea
todo. Es distinto de `trips`, donde la policy deja leer los borradores y cada
página tiene que acordarse de filtrarlos (ver el "Ojo" de CLAUDE.md). Acá una
ruta nueva que se olvide del filtro no puede filtrar un borrador.

**`published_at` lo sella el trigger** la primera vez que pasa a publicado, y no
se vuelve a tocar: es la fecha que muestra el sitio, y corregir una coma de un
texto viejo no debería mandarlo arriba de todo en el listado.

**La portada va al bucket `site-assets`**, bajo el prefijo `articles/`, y no a un
bucket nuevo: es contenido editable del sitio, con el mismo criterio de RLS
(escritura solo admin, lectura pública por URL) que ya está auditado. Se recorta
a 16:9 **en el browser antes de subir**, con el mismo helper que las portadas de
viaje (`compressImage`, ver `docs/PORTADAS.md`).

**El slug se sugiere solo desde el título** y se puede editar. En un artículo que
ya existe deja de seguir al título: cambiar la dirección rompe el link que ya
circuló. Al guardar, el server lo normaliza igual — el CHECK de la tabla no
acepta nada fuera de `[a-z0-9-]`.

## Lo que quedó afuera

- **Orden manual**: el listado ordena por fecha de publicación, descendente. No
  hay "fijar arriba" ni orden a mano.
- **Autor visible**: `updated_by` se registra pero no se muestra. Todo el
  contenido es de Cosmic Eagle.
- **Imágenes dentro del texto**: hay una sola portada por artículo.
- **Buscador y paginado**: con la cantidad esperada no hacen falta; si el listado
  crece, el paginado va antes que el buscador.
- **Los testimonios de la home** (`TestimonialsSection`) siguen siendo mock y no
  leen de acá. Unificarlos es una decisión de diseño, no de datos.

## Sin verificar end-to-end

Requiere sesión de admin (la hace Ignacio): cargar un artículo con portada desde
el panel, publicarlo y verlo en `/contenidos` y en su página. Lo verificado por
código: build de producción, y las policies probadas con `set role` — `anon` y un
usuario logueado no admin solo ven los publicados y no pueden escribir; el admin
ve borradores, escribe, y el trigger registra autor y fecha de publicación.
