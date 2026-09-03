# Design System — Fix mobile de "Tecnología Humana y Ciencia del Alma" (Homepage, Cosmic Eagle)

Parche puntual sobre una sección ya existente y aprobada de `homepage.html` (`#tecnologia`). Ver también `notas-implementacion-tecnologia-mobile-fix.txt` para contexto de por qué hacía falta este fix y el detalle del bug de layout que lo originó.

> **ACTUALIZACIÓN — v2 (ronda de corrección sobre la entrega anterior de este mismo documento):**
> Julia marcó la primera entrega como incorrecta tras compararla con su mockup de referencia y pidió dos cambios puntuales, **ambos en el HTML, no en el CSS de mobile** (eso ya había quedado bien en la v1):
> 1. El título cambia de copy: de una línea ("Tecnología del Alma") a **dos líneas fijas**: "Tecnología Humana y" / "Ciencia del Alma".
> 2. El botón "IR MÁS PROFUNDO" pasa de `<button>` sin acción a **link a la página Contenidos**.
>
> Ver §8 para el detalle. Todo lo demás documentado en este archivo (§1 a §7) sigue vigente sin cambios de esa ronda: colores, y el fix de `flex:1`→`flex:none`.
>
> **ACTUALIZACIÓN — v3 (ronda de corrección sobre la v2):** Julia confirmó que el título y el botón de la v2 quedaron bien, pero marcó un problema distinto: la caja de texto en mobile (el `max-width:min(256px,60vw)` de la v1, nunca cuestionado hasta ahora) quedaba demasiado angosta frente a su imagen de referencia — todo el bloque se veía "achicado hacia el centro", con demasiado aire en los márgenes. **Esto reemplaza la fórmula de ancho de caja y los tamaños de fuente de §3/§4 — ver §9 (nuevo) para los valores vigentes.** El fix de `flex:1`→`flex:none` (§6) y el título/botón de v2 (§8) siguen vigentes sin cambios.

## 1. Qué cambia y qué no (respecto a la sección original, antes de cualquier fix)

| | Antes | Ahora |
|---|---|---|
| Alcance del CSS de mobile | Solo mobile (`@media max-width:768px`) | Sin cambios — sigue siendo solo mobile |
| Desktop | Sin cambios | El bloque de texto en desktop no tiene cambios de CSS; sí cambia el copy del título y el tag del botón (ver §8), visible también en desktop porque es el mismo HTML |
| HTML | — | **Cambia en v2** — ver §8. La v1 de este fix no había tocado el HTML (era 100% CSS); esta v2 sí, en título y botón |

## 2. Problema que resuelve

En mobile, la sección "Tecnología del Alma" (`#tecnologia`) ocupaba más de una pantalla de alto (scroll largo) y el bloque de texto quedaba pegado al margen izquierdo, sin aire. Causas:
- El título (`.tec-text h2`) heredaba el tamaño de desktop (40px) sin ningún override para mobile.
- El cuerpo (`.tec-text p`) heredaba 16px y un `max-width:480px` de desktop, ocupando casi todo el ancho del viewport.
- El bloque de texto (`.tec-text`) no tenía margen horizontal propio — quedaba pegado al padding del contenedor.

## 3. CSS nuevo (dentro de `@media (max-width:768px)`, reemplaza las 3 líneas que había antes para esta sección)

```css
.tecnologia{flex-direction:column;align-items:center;justify-content:center;}
.tec-text{flex:none;width:100%;max-width:min(256px,60vw);text-align:left;}
.tec-text h2{font-size:22px;margin-bottom:8px;}
.tec-deco-line{margin-bottom:16px;}
.tec-text p{font-size:12px;line-height:1.7;color:#000;margin-bottom:16px;max-width:100%;}
.tec-text .tec-p3{margin-bottom:24px;}
.tec-image{display:none;}
```

Antes, esas mismas 3 selectores decían:
```css
.tecnologia{flex-direction:column;align-items:flex-start;}
.tec-text{width:100%;text-align:left;}
.tec-image{display:none;}
```

## 4. Spec exacta por elemento (mobile, ≤768px)

| Elemento | Propiedad | Valor |
|---|---|---|
| Título (`.tec-text h2`) | font-family | Domine (`'Domine',Georgia,serif`) |
| | font-weight | bold (700) |
| | font-size | **22px** |
| | color | **#05125A** (var `--azul-oscuro`, sin cambios respecto a desktop) |
| Cuerpo (`.tec-text p`, clase `.sans`) | font-family | Montserrat (`'Montserrat','Helvetica Neue',Arial,sans-serif`) |
| | font-size | **12px** |
| | color | **#000000** |
| | text-align | **left** |
| | line-height | 1.7 |
| Caja de texto (`.tec-text`) | max-width | **`min(256px, 60vw)`** — ver §5 |
| | alineación horizontal | centrada dentro de la sección (`align-items:center` en el padre) |
| Botón "IR MÁS PROFUNDO" | — | mismo estilo visual (`.tec-btn`); en v2 pasó a ser un link — ver §8 |
| Imagen de fondo (`.tec-image`) | — | sigue oculta en mobile (`display:none`), sin cambios |

## 5. Ancho de caja de texto — responsive, no un valor fijo

Julia pidió 256px como referencia tomando el iPhone 16 Pro Max (viewport CSS de 430px de ancho) como base — no un valor fijo para todos los dispositivos. La fórmula usada es:

```
max-width: min(256px, 60vw)
```

- En una pantalla de 430px de ancho (iPhone 16 Pro Max), `60vw = 258px` → prácticamente los 256px de referencia.
- En pantallas más angostas, `60vw` da un valor menor a 256px, así que la caja se angosta proporcionalmente (evita que en un teléfono chico la caja de 256px se sienta desproporcionadamente ancha).
- En pantallas de hasta 768px (techo de este breakpoint), el tope de `256px` frena el crecimiento — sin el `min()`, a esos anchos `60vw` daría cajas mucho más anchas de lo previsto.

Si el desarrollador porta esto a Tailwind, el equivalente es algo como `max-w-[min(256px,60vw)]` (arbitrary value), o una utilidad de container query si el proyecto ya usa ese patrón en otro lado.

## 6. Por qué el fix necesitó tocar `.tec-text{flex:...}` (importante para no reintroducir el bug)

`.tec-text` tiene, en la regla de **desktop** (sin cambios, sigue así): `flex:1;max-width:50%;`. En mobile, la sección pasa a `flex-direction:column` y, como la imagen (`.tec-image`) está en `display:none`, `.tec-text` termina siendo el ÚNICO ítem flex del contenedor. `flex:1` hace que ese único ítem **crezca para llenar todo el alto disponible** de la sección — eso es lo que causaba que, aunque se agregara `justify-content:center` al contenedor, no hubiera ningún espacio "libre" que centrar (el ítem ya ocupaba todo el alto). La corrección clave fue agregar `flex:none` a `.tec-text` **dentro del media query de mobile únicamente** — así en mobile el bloque de texto solo ocupa el alto de su contenido real, dejando que `justify-content:center` en el padre reparta el resto arriba/abajo por igual. **Este `flex:none` es tan importante como los cambios de tipografía — si se omite al portar, el centrado vertical no funciona aunque el resto de los valores sean correctos.**

## 7. Verificado

Con Playwright, en 3 anchos: 430×932 (iPhone 16 Pro Max, referencia de Julia), 390×844 (viewport estándar de verificación del proyecto) y 360×780 (Android angosto). En los tres, la sección completa (título+línea+3 párrafos+botón) entra en un solo alto de pantalla con aire simétrico arriba/abajo, y el ancho de la caja de texto escala proporcionalmente. Desktop (1440×900) verificado sin cambios respecto a la versión anterior.

## 8. v2 — Cambios de copy y de comportamiento (título de dos líneas + botón como link)

Esto es lo nuevo en esta ronda. A diferencia de §1-§7 (que es CSS de mobile), esto es HTML, y aplica igual en mobile y desktop porque es el mismo markup en ambos.

### 8.1 Título — de una línea a dos líneas fijas

```html
<!-- Antes -->
<h2>Tecnología del Alma</h2>

<!-- Ahora -->
<h2>Tecnología Humana y<br>Ciencia del Alma</h2>
```

El salto de línea es un `<br>` literal — **no** depende del ancho de pantalla, es un quiebre de línea fijo en dos renglones siempre, igual que el patrón ya usado en `.nos-cierre-title` de `nosotros.html` (`UN VIAJE HACIA EL<br>HUMANO LUMINOSO`). No se tocó ninguna propiedad de CSS del título (`.tec-text h2` sigue en 40px desktop / 22px mobile, Domine bold, `#05125A`) — el único cambio es el texto y el `<br>`.

Si el desarrollador porta esto con contenido dinámico (CMS/i18n) en vez de HTML estático, el equivalente es renderizar el string con un salto de línea explícito en esa posición (ej. dos campos de texto separados, o un `\n` que se transforme en `<br>`/`white-space:pre-line` según el approach del proyecto) — no confiar en que el texto haga wrap solo, porque el punto de quiebre elegido ("...Humana y" / "Ciencia...") es una decisión de diseño, no un efecto del ancho de la caja.

### 8.2 Botón "IR MÁS PROFUNDO" — de `<button>` sin acción a link a Contenidos

```html
<!-- Antes -->
<button class="tec-btn">IR MÁS PROFUNDO<span class="btn-arrow">↗</span></button>

<!-- Ahora -->
<a href="contenidos.html" class="tec-btn">IR MÁS PROFUNDO<span class="btn-arrow">↗</span></a>
```

- El botón ahora navega a la página **Contenidos** (`contenidos.html` en el mockup estático; en la app real, la ruta de Contenidos que ya tengan definida).
- Mismo patrón que usan otros CTAs del sitio que navegan a otra página (ej. `.navbar-cta`, o `.nos-btn-glow` en `nosotros.html`, que también son `<a>` con la clase del botón, no `<button>`).
- **Detalle a no perderse al portar:** al pasar de `<button>` a `<a>`, el navegador agrega automáticamente un subrayado por defecto (`text-decoration:underline`) que el botón nunca tuvo. Por eso se agregó explícitamente `text-decoration:none` a la regla `.tec-btn` (antes no hacía falta, porque `<button>` no subraya su texto). Si portan esto a React/Next con un componente `<Link>` o `<a>`, hay que asegurarse de que esa clase (o su equivalente Tailwind, `no-underline`) esté aplicada — si no, el botón se ve "roto" con un subrayado que no está en el diseño.
- El resto del estilo del botón (gradiente dorado, `:hover`/`:active` con glow, tamaño, radio) no cambió — el `.tec-btn:hover,.tec-btn:active{...}` sigue funcionando igual sobre el `<a>`.

### 8.3 Verificado (v2)

Re-verificado con Playwright en los mismos 4 anchos (430×932, 390×844, 360×780, 1440×900): el título renderiza en dos líneas en todos los anchos, el botón es un `<a>` con `href="contenidos.html"`, sin subrayado, con el mismo estilo visual que antes, y la sección completa sigue entrando en una sola pantalla de alto en mobile (el título de dos líneas no rompió el centrado vertical logrado en la v1 de este fix).

## 9. v3 — Caja de texto y tipografía de mobile, corregidas contra la imagen de referencia

Julia aprobó título y botón de la v2, pero marcó un problema que venía de la v1 y no se había cuestionado hasta ahora: en mobile, la caja de texto (`max-width:min(256px,60vw)`, spec original de Julia del pedido que originó este fix) quedaba demasiado angosta comparada con su imagen de referencia — el bloque completo se veía "achicado hacia el centro", con demasiado aire muerto en los márgenes laterales. Esta sección **reemplaza** la fórmula de ancho y los tamaños de fuente del §3/§4; el resto de este documento (§1-§8) sigue vigente.

### 9.1 Cómo se midió esto (para que quede trazable, no "a ojo")

Julia no dio un ancho ni tamaños de fuente nuevos en esta ronda — dijo "corregilo para que quede igual a la referencia deseada". Para no adivinar, se midió directamente sobre los píxeles de su imagen de referencia (analizando el archivo con Python/Pillow, detectando dónde empieza/termina el texto en cada línea):

| Medida | En la imagen de referencia (proporción sobre el ancho total del frame) | Aplicado (redondeado, sobre el viewport real) |
|---|---|---|
| Margen izquierdo del texto | ~10.5% del ancho | Ya cubierto por el padding existente de la sección (24px, el mismo que usan todas las secciones del sitio en mobile) |
| Ancho de la caja de texto | ~72-75% del ancho (llega a envolver casi todo el frame, muy por encima del ~60% que daba la fórmula vieja) | `max-width:100%` — el texto pasa a ocupar todo el espacio disponible dentro del padding de la sección, en vez de un tope artificial de 256px |
| Tamaño del título (altura de mayúsculas) | ~7.4% del ancho del frame | `clamp(24px, 7vw, 30px)` |
| Tamaño del cuerpo (x-height) | ~3.6% del ancho del frame | `clamp(13px, 3.6vw, 15px)` |
| Ancho de la línea decorativa dorada | ~20.6% del ancho del frame | 80px (antes 64px) — se dejó en px fijo, igual que el resto del sitio, no en %, por consistencia con el resto de líneas decorativas del sitio (todas fijas) |

Estas proporciones se tradujeron a `clamp()` para que sean responsive (escalan con el viewport igual que el resto de la sección) en vez de valores fijos únicos, consistente con el pedido original de Julia de que todo esto fuera "adaptable, responsive".

### 9.2 CSS nuevo (dentro de `@media (max-width:768px)`, reemplaza las líneas equivalentes de §3)

```css
.tecnologia{flex-direction:column;align-items:center;justify-content:center;}
.tec-text{flex:none;width:100%;max-width:100%;text-align:left;}
.tec-text h2{font-size:clamp(24px,7vw,30px);margin-bottom:14px;}
.tec-deco-line{margin-bottom:20px;}
.tecnologia.in-view .tec-deco-line{width:80px;}
.tec-text p{font-size:clamp(13px,3.6vw,15px);line-height:1.8;color:#000;margin-bottom:20px;max-width:100%;}
.tec-text .tec-p3{margin-bottom:28px;}
.tec-image{display:none;}
```

Notar que `.tecnologia.in-view .tec-deco-line{width:80px;}` es una regla **nueva**, agregada dentro del media query — antes solo existía la regla global (fuera del media query) que ponía la línea en 64px tanto en desktop como en mobile; ahora mobile tiene su propio valor de 80px, sin tocar el de desktop.

### 9.3 Por qué esto NO reintrodujo el problema original (sección ocupando más de una pantalla)

Este es el punto que más vale la pena entender antes de tocar cualquiera de estos valores: agrandar la tipografía normalmente agregaría alto a la sección, con riesgo de volver a desbordar una pantalla — el problema original que motivó todo este fix (§2). Pero acá pasó lo contrario: al ensanchar la caja de texto de ~60% a 100% del ancho disponible, cada párrafo envuelve en **menos líneas** (más caracteres por línea), y esa reducción de líneas compensa el tamaño de fuente mayor. Verificado con Playwright: la sección sigue entrando en exactamente una pantalla de alto en los 3 anchos de referencia (430×932, 390×844, 360×780) — los mismos resultados de encaje que ya se habían logrado en la v1, sin necesidad de tocar el fix de `flex:1`→`flex:none` (§6) ni el `justify-content:center` (siguen intactos). Si en una futura ronda se agranda la tipografía todavía más SIN ensanchar también la caja, este equilibrio se puede romper — si eso pasara, sería momento de revisar el encaje de una pantalla de nuevo, no asumir que sigue sosteniéndose automáticamente.

### 9.4 Verificado (v3)

Con Playwright, en los mismos 4 anchos de siempre (430×932, 390×844, 360×780, 1440×900): la caja de texto ocupa el ancho completo disponible (visualmente ya no se ve "achicada" ni centrada con aire de sobra), tipografía notablemente más grande y responsiva, la sección sigue entrando en una sola pantalla de alto en los 3 anchos mobile, y desktop queda exactamente igual que antes (no se tocó ninguna regla fuera del media query de mobile).
