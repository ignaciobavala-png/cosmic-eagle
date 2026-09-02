# Entrega de Julia — homepage, correcciones del 1/9/2026

La carpeta original está copiada en **`docs/entregas/homepage-2026-09-01/`**. Es la
tercera entrega que llega por `~/Descargas` y ya perdimos dos ahí (los tres HTML de
Julia y el `web-cosmic-journey-ES.md` de Sofía con las FAQs y Privacidad), así que
esta vez se copió al repo antes de leerla.

## 1. Qué es

**No es un rediseño nuevo**: es la home que ya está en producción, con tres rondas de
correcciones del 1/9, y por primera vez un **paquete formal** en vez del HTML suelto.

| Archivo | Qué es |
|---|---|
| `homepage_correccion.html` | El mockup aprobado, autocontenido (logo en base64) |
| `design-system-homepage.md` | Spec técnica: tokens, tipografía, tamaños por sección, tabla de animaciones |
| `notas-implementacion-homepage.txt` | Notas del agente de Julia **para nosotros** |
| `aclaraciones_importantes_de_julia_para_nacho.txt` | Los pedidos de Julia, en sus palabras |
| `cosmic-eagle-logo.png` | **Byte por byte igual** a `public/logo.png`. No hay nada que hacer |

Las notas de implementación están escritas por el agente de Julia para el nuestro: nos
cita por bugs que arreglamos (`use-section-progress.ts` por su nombre) y avisa dónde el
mismo problema vuelve a aparecer. El canal entre los dos agentes funciona; conviene
responder por el mismo camino.

## 2. El reclamo número uno — HECHO

> *"en la versión anterior subida el banner hero era más grande que la screen y el
> indicador de scroll con el texto 'descubrir' quedaba no visible. prestarle atención a
> esto en **todas** las screens ya que la mayoría tienen indicador de scroll"*

Era real y la causa estaba en el código: el hero medía `100svh` **dentro de un `main`
que ya esquiva el navbar opaco con `pt-16 lg:pt-21`**. O sea una pantalla entera
empezando *debajo* de la banda: el hero terminaba 84px más abajo del pliegue y se
llevaba puesto el indicador, que va anclado al pie.

Medido en producción antes del arreglo:

| Pantalla | Ruta | Indicador |
|---|---|---|
| 1440×900 | `/` | 44px afuera |
| 1440×900 | `/nosotros`, `/viajes` | 52px afuera |
| 390×844 | `/` | 24px afuera |
| 390×844 | `/nosotros`, `/viajes` | 32px afuera |

Arreglado con `--navbar-h` en `globals.css` (4rem, 5.25rem en `lg`), que pasa a ser la
**única fuente de verdad** del alto de la banda: ya la usaba el `scroll-padding-top` de
los anclajes y ahora la restan los dos heros. `full` pasó a
`h-[calc(100svh-var(--navbar-h))]` y **perdió el `min-h-[34rem]`** — un piso en `rem`
vuelve a empujar el indicador debajo del pliegue en una pantalla baja, que es
exactamente lo que esta variante tiene que evitar. El `banner` no se pasaba de alto pero
su tope en `rem` sí podía comerse el indicador en una pantalla ancha y baja: su `max-h`
ahora se mide también contra el pliegue.

Cubierto por un test de regresión (`e2e/publico.lectura.spec.ts`), que mide el indicador
y no el alto de la sección: lo que importa es que se vea. Verificado que **falla contra
la producción vieja** en las tres rutas con hero `full` y pasa en las dos de `banner`.

## 3. Lo que falta, en tres montones

### a. Números que no coinciden

- **Navbar**: la spec dice 96px desktop / 72px mobile; el nuestro mide 84/64.
- **Celeste del navbar**: el real es `#0079B3` y usamos `#026fab`. Ella misma lo marca
  como "pendiente de alinear", así que lo sabe.
- **Forma del degradé**: la spec dice `linear-gradient(90deg, #05125A, #0079B3)`, dos
  paradas planas. El nuestro tiene la meseta hasta el 31% que sacamos de `navbar.png`
  (20/08). Hay que decidir cuál gana — el asset o la spec.
- **`ScrollStory`**: la spec detalla 400vh y cuatro fases con `KEYWORD_START_OFFSETS` en
  píxeles; el nuestro mide 360vh y tiene la fase 3 simplificada (las palabras aparecen
  centradas en vez de viajar desde su lugar en el párrafo). Deuda ya anotada el 27/08,
  ahora con los números exactos para saldarla.
- **"Nuestro propósito"**: el cuerpo se anima palabra por palabra, agrupadas por la línea
  **real** del navegador (`getBoundingClientRect`, no una línea fija), 900ms por línea y
  150ms entre líneas; el botón entra por `setTimeout` calculado
  (`(líneas-1)*150 + 900 + 100`), no por scroll. Hoy el cuerpo entra como un bloque.

### b. Comportamiento que difiere y hay que renegociar

**La cartelera.** En el mockup arranca **cerrada** y la abre el botón "Explorar
experiencias" del scroll-story, con autoplay infinito hacia la izquierda que se frena al
hover o al tap. En el nuestro está abierta por defecto (`defaultOpen`) y la fila se
arrastra a mano. Lo decidimos nosotros, con el argumento de que un carrusel en
movimiento no se puede tocar en mobile y cada tarjeta es un link — pero **su versión ya
contempla esa objeción**: en mobile apaga el autoplay y deja `overflow-x:auto`. Conviene
ceder acá.

Dos detalles del mockup que no son adorno y hay que copiar si se implementa el toggle:

1. Antes de hacer scroll a la cartelera, salta al final exacto del tramo sticky de
   `.scroll-story`; si no, el panel pegajoso queda superpuesto sobre el carrusel que se
   abre.
2. El indicador de scroll del pie de `.about` se **esconde** mientras la cartelera está
   abierta, porque está anclado al borde inferior de la sección y quedaría en el medio
   del carrusel.

### c. Lo que no es diseño y toca la plataforma

Esto vale más que todo lo visual junto:

1. **Cajas de texto opcionales sobre cada banner, con elección de tamaño de fuente desde
   el panel.** Hoy `site_content` guarda un string por slot: esto pide un slot con
   formato o slots hermanos de tamaño. Es trabajo en `/admin/multimedia`, no en la home.
2. **Click en una tarjeta de la cartelera**: con sesión va al viaje, sin sesión aparece
   un cartel para iniciar sesión — **que "está en proceso de diseño"**, o sea que todavía
   no llegó. Hoy la tarjeta linkea derecho y el gate lo hace `/viajes/[id]/solicitar`.
3. **Nomenclatura "Ceremonias → Sesiones" y "Retiros → Viajes" en todo el sitio, panel de
   admin incluido.** Toca `/admin/retiros`, `/admin/ceremonias` y `src/lib/trip-type.ts`.
   Es un renombre de **etiquetas**, no del enum de Postgres ni de las rutas públicas.

## 4. Assets que Julia todavía debe

Ninguno bloquea: hoy renderizan placeholder o degradé, igual que en su mockup.

- Video del hero (5 seg, MP4).
- Imágenes de Atmosférica, Tecnología del Alma y Cierre.

## 5. Preguntas que la entrega CIERRA

Salen de `~/Escritorio/consultas-julia-rediseno.html`:

- **Tipografía**: Domine (headings/botones) + Montserrat (cuerpo). El Georgia que
  aparecía en algunos renders es falla de carga del entorno de mockup, **nunca fue
  Literata**.
- **Navbar opaco**: correcto, no revertir.
- **Testimonios**: los tres juegos llevan textos distintos, no se recicla el mismo set.
  Ya lo hacemos así (`testimonials.placement`); faltan los textos reales.
- **Botón de cuenta**: uno solo que cambia de texto ("Unirme al círculo" ↔ "Mi cuenta"),
  no dos.

## 6. Código muerto que la spec avisa

La clase `.symbol-note` del CSS no la usa ningún elemento: fue un intento de símbolos
decorativos en Sesiones/Viajes que Julia descartó. **No hay que reproducirla.**
