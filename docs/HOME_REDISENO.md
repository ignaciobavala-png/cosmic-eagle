# Rediseño de la home — mockup de Julia (20/08/2026)

Fuente: `Homepage_correcciones(1).png` (1440 x 5292), en `~/Descargas`, **fuera del
repo**. Julia va a mandar los slides por separado; este documento es el mapa de la
foto completa y el plan. **Nada de esto está implementado todavía.**

---

## 1. Mapa del mockup, de arriba a abajo

| # | Franja (px @1440) | Sección | Qué hay |
|---|---|---|---|
| 0 | 0–56 | **Navbar** | Logo + `NOSOTROS · EXPERIENCIAS · CONTENIDOS` + CTA sólido dorado "UNIRME AL CÍRCULO →" |
| 1 | 56–830 | **Hero** | Imagen full-bleed (figura de partículas mirando arriba). **Sin título y sin CTA.** Al pie, cue "DESCUBRIR" + chevron |
| 2 | 830–1570 | **Frase manifiesto** | Fondo azul con glow radial central, una sola línea centrada: *"Cuando el alma está lista, el camino aparece."* |
| 3 | 1630–2420 | **"La humanidad"** — bloque claro | **Fondo crema** (`#FDF6EE` aprox). Título en dos pesos: **La humanidad** / está recordando su verdadera naturaleza. 3 párrafos (el 3º en negrita). Botón ghost "ACCESO COMUNIDAD". A la derecha, ilustración de **geometría sagrada dorada** (racimo de círculos tipo semilla de la vida) |
| 4 | 2420–3200 | **Cuatro promesas** | Figura meditando full-bleed, 4 textos flotando en las esquinas: *Despierta nuevas capacidades internas · Expande tu camino personal · Desbloquea tu conexión con lo divino · Contribuye a la evolución colectiva* |
| 5 | 3350–4300 | **Voces de Luz** | Título + label con dividers "LO QUE DICEN NUESTROS VIAJEROS". 3 cards de testimonio (glass) con avatar de inicial, nombre y país: Valeria/Uruguay, Claudia/Chile, Andrew/Inglaterra |
| 6 | 4300–4990 | **Imagen de cierre** | Full-bleed, figura de partículas. Sin texto encima |
| 7 | 4990–5080 | **Banda dorada** | Franja sólida dorada con 3 estrellas de 4 puntas dentro de círculos, centradas |
| 8 | 5080–5292 | **Footer** | Logo + `EXPLORAR` (Nosotros, Experiencias, Contenidos) + `LEGAL` (Privacidad, Términos de Servicio, Contacto, Soporte) + `SINTONIZA` (newsletter) |

---

## 2. Contra la home de hoy (`src/app/page.tsx`)

| Hoy | En el mockup | Qué implica |
|---|---|---|
| `HeroSection` (título + subtítulo + 2 CTAs) | Hero **solo imagen** + "DESCUBRIR" | Se cae el copy del hero. ¿Dónde entra el CTA principal? |
| `PortalsSection` (carrusel que gira, hecho el 18/08) | **no está** | ¿Se borra, se muda a `/nosotros` o Julia lo manda en un slide aparte? |
| `AboutSection` (foto + texto, imagen editable desde Multimedia) | Reemplazado por el bloque claro "La humanidad" | El slot `home.about.image` puede quedar sin uso o mutar a la geometría |
| **`TripsSection type="retiro"` + `type="ceremonia"`** (datos reales de Supabase) | **no están** | **El punto más grave**: hoy la home es la vitrina de los viajes publicados. Ver §4 |
| `EbookSection` | **no está** | El CTA "Comprar Ahora" ya estaba muerto; esto lo confirma como fuera de la home |
| `TestimonialsSection` (mock, 3 cards con estrellas) | "Voces de Luz", 3 cards con país | Mismo componente, otra forma: sin estrellas, con avatar de inicial y país |
| — | **Frase manifiesto**, **Cuatro promesas**, **Imagen de cierre**, **Banda dorada** | Cuatro bloques nuevos |
| Footer 4 columnas | Footer **3 columnas** + newsletter | Cambia el orden y los rótulos |

---

## 3. Lo que el mockup decide sin decirlo

1. **"EXPERIENCIAS" reemplaza a "Viajes" en el navbar.** Esto cierra el problema de
   nomenclatura abierto el 15/08: en el vocabulario de Sofía "Viaje Cósmico" es solo el
   retiro, y el paraguas se había quedado sin nombre. El paraguas se llama
   **Experiencias**. Falta decidir si la ruta pasa a `/experiencias` (con redirect de
   `/viajes`) o si solo cambia la etiqueta.
2. **No hay desplegable Retiros/Ceremonias** en el navbar del mockup. Hoy sí lo hay
   (`NAV_LINKS`, sesión del 05/08).
3. **No aparece "Mi Cuenta"** en el navbar — solo el CTA "Unirme al círculo". Con sesión
   iniciada hoy ese CTA se reemplaza por el avatar; hay que confirmar que sigue así.
4. **El fondo deja de ser siempre oscuro.** El bloque "La humanidad" es crema con texto
   azul marino. Rompe la regla actual de `globals.css` (degradé azul→negro de documento
   completo + campo de estrellas en `body::before`). Necesita una primitiva de sección
   invertida, no un parche.
5. **Assets nuevos que hay que pedirle a Julia**: la geometría sagrada dorada, la estrella
   de 4 puntas de la banda, y las 4 imágenes full-bleed (hero, meditando, cierre, y el
   fondo de Voces de Luz) en calidad final. Hoy `public/img/` no tiene ninguna.

---

## 4. Dónde van los viajes — RESUELTO (20/08, Ignacio)

**Los viajes salen de la home y viven en la sección de viajes**, cada uno en su tipo:
retiros y ceremonias, como ya funciona hoy en `/viajes`. La home nueva es **puramente
narrativa** y no consulta `trips`.

Consecuencias:

- Se borran las dos `TripsSection` de `src/app/page.tsx`. Era lo único no decorativo que
  quedaba en la home.
- **El único camino al embudo de inscripción pasa a ser el navbar.** Antes desde la home se
  llegaba en un click a `/viajes/[id]` y de ahí a `/viajes/[id]/solicitar`; ahora son dos
  saltos. Hay que asegurarse de que "Experiencias" quede bien visible en el nav — es la
  entrada al negocio.
- **Efecto lateral bueno**: la home deja de consultar Supabase y vuelve a ser prerender
  estático (hoy es dinámica, `ƒ`, justamente por esa consulta). Se sirve entera desde el
  CDN, no gasta egress del free tier y carga más rápido. Sumado a §6, la home nueva es más
  liviana que la actual pese a tener cuatro imágenes grandes.
- La ruta **sigue siendo `/viajes`**; lo que cambia es la etiqueta del nav, que pasa a
  "Experiencias" según el mockup. No hace falta redirect ni tocar links existentes.

## 5. Especificación de cada bloque (confirmada por Ignacio, 20/08)

### 5.1 Hero — zoom in lento
- Imagen full-bleed, **sin título ni CTA**, con el cue "DESCUBRIR" + chevron al pie.
- Animación: `scale(1) → scale(1.1)`, **delay 200 ms, duración 8000 ms**, una sola vez al
  cargar (no en loop, no ligada al scroll).
- Se hace con `transform` (lo maneja el compositor). **No** animar `width`/`height` ni
  `background-size`: eso repinta cada frame y se come el LCP justo en el primer pantallazo.
- El contenedor lleva `overflow: hidden` — la imagen crece hacia afuera del recorte.
- `prefers-reduced-motion: reduce` → sin zoom, imagen fija.
- El cue "DESCUBRIR" hace scroll suave al bloque 2.

### 5.2 Frase manifiesto — entrada partida en dos
- La frase se parte en **dos mitades**:
  - izquierda: entra **de abajo hacia arriba**, `opacity 0 → 1`
  - derecha: entra **de arriba hacia abajo**, `opacity 0 → 1`
  - las dos terminan alineadas en el centro, en una sola línea.
- Dispara al entrar en viewport (`whileInView`, una sola vez).
- El corte de la frase es una decisión de diseño, no automática: *"Cuando el alma está
  lista, | el camino aparece."* — se guarda como dos strings, no se parte por índice.
- **En mobile la frase cae a dos líneas**: la animación tiene que seguir leyéndose (mitad
  de arriba entra desde arriba, mitad de abajo desde abajo). Se verifica en el paso 5.
- Julia manda el slide como **máscara de sombra (overlay con transparencia)** — o sea un
  PNG con alpha que va **encima** del fondo, no un fondo opaco. Ese PNG conserva el canal
  alfa: se convierte a **WebP con alpha**, nunca a JPG.
- `prefers-reduced-motion` → aparece sin desplazamiento, solo el fundido.

### 5.3 "La humanidad" — bloque claro
- El slide se copia **completo y literal**: título a dos pesos, los 3 párrafos, la
  geometría dorada. El copy es de la clienta, no se reescribe.
- El botón **"ACCESO COMUNIDAD" lleva al login**: `/cuenta`. (Si la intención es que el
  visitante nuevo se registre, el destino correcto sería `/cuenta?modo=registro`, que es a
  donde ya apunta "Unirme al círculo" del navbar — **confirmar cuál de los dos**.)
- Es el único bloque de fondo claro: ver §3.4, necesita primitiva propia.

### 5.4 Cuatro promesas
Se copia tal cual. En mobile los 4 textos no pueden quedar en las esquinas: pasan a lista
debajo de la imagen.

### 5.5 Voces de Luz
Se copia tal cual — son **testimonios**. Detalle útil: `TESTIMONIALS` en
`src/lib/constants.ts` **ya tiene la forma exacta** que pide el mockup
(`quote / name / location / initial`); cambian los nombres y el estilo de la card (sin
estrellas), no la estructura de datos.

### 5.6 Banner de cierre → banda dorada → footer
Ese es el orden final: imagen full-bleed de cierre, después la banda dorada con las 3
estrellas, y al pie el footer.

---

## 6. Peso de los slides y consumo del plan gratuito

El mockup que mandó Julia pesa **6,9 MB en un solo PNG de 1440×5292**. Si las 4 imágenes
full-bleed llegan en PNG a esa densidad, la home sin tratar arrancaría en **20–30 MB**:
inusable en mobile y con riesgo real de reventar cuotas.

### 6.1 Tratamiento de los assets (paso obligatorio, antes de escribir la sección)
- **PNG → WebP** y redimensionar a **1920 px de ancho máximo** (el mockup viene a 1440, no
  hace falta más). Calidad 75–82. Esperado: **6,9 MB → 200–350 KB por imagen.**
- La **excepción es la máscara de sombra de la frase manifiesto**: lleva transparencia, así
  que va a WebP **con alpha** (no a JPG, que la aplana contra negro).
- Referencia: la entrega original de Julia pasó de 11,4 MB a 267 KB con este mismo
  tratamiento (ver `public/img/`).

### 6.1.b Estructura de la entrega de Julia — `example/` y `produccion/`

Julia entrega **dos carpetas con el mismo listado de archivos**:

| Carpeta | Contenido | Para qué |
|---|---|---|
| `example/` | los slides **con** texto y botones | referencia exacta: dónde va cada palabra, con qué tamaño y alineación |
| `produccion/` | los mismos slides **sin** texto ni botones (solo fondo) | lo que se convierte y entra al sitio |

**El nombre de archivo tiene que ser idéntico en las dos carpetas** — es lo que permite
parear una con otra sin adivinar. Numerados por orden de aparición en la página:

```
01-hero   02-frase   03-humanidad   04-promesas   05-voces   06-cierre
```

**La carpeta vive fuera del repo**, como la entrega original (`~/Descargas/frontend_eagle`).
Al repo entra **solo `produccion/`, ya convertido a WebP**, en `public/img/home/`.

Motivo: todo lo que está en `public/` se deploya. Los PNG con texto son material de
trabajo, no del sitio — meterlos ahí sumaría ~7 MB que nadie va a ver, copiados en cada
build y en el historial de git para siempre.

Si se quiere dejar la referencia versionada, la opción barata es guardar en `docs/mockups/`
una versión **reducida** de los `example/` (1000 px de ancho, WebP, ~80 KB cada uno). Eso
no pesa y sobrevive a que se borre la carpeta de Descargas.

### 6.1.c Inventario de la entrega recibida (20/08, `~/Descargas/EXAMPLE` y `PRODUCCION`)

| EXAMPLE (con texto) | PRODUCCION (sin texto) | Estado |
|---|---|---|
| `nav bar.png` 1440×84 | — (+ `LOGO.png` 1207×433) | ✅ no hace falta asset: es color sólido + logo |
| `hero.png` 1440×800 | `hero.jpg` **2590×1429** | ✅ y en mejor resolución |
| `About_Section.png` 1440×800 | `frase manifiesto.png` 1440×800 | ✅ **pero cambia de nombre**: son el mismo bloque |
| `la humanidad.png` 1440×800 | `la humanidad.png` 1440×800 | ✅ |
| `cuatro promesas.png` 1440×800 | `cuatro promesas.png` 1456×816 | ✅ llegó el 20/08 a la raíz de Descargas, no adentro de `PRODUCCION/` |
| `voces de luz.png` 1440×800 | `voces de luz.png` 1440×800 | ✅ |
| `imagen de cierre.png` 1440×800 | `imagen de cierre.png` **2109×1049** | ✅ mejor resolución |
| `banda dorada.png` 1440×138 | **falta** | ⚠️ se puede hacer en CSS + SVG, ver abajo |
| `footer.png` 1440×270 | `footer.png` 1440×270 | ✅ |
| `backgroundcolor_#05125A.png` | — | referencia de color base: **`#05125A`** |

**La máscara de la frase manifiesto tiene alfa real** (verificado: alfa 0 en las esquinas,
254 en el centro). Es el óvalo de luz que va **encima** del fondo de la página. Confirma
§5.2: se convierte a WebP con alpha, nunca a JPG.

#### Tres de los siete "assets" no son imágenes, son degradés

Al convertirlos quedó a la vista: `footer.png` pesa **2 KB** en WebP y `la humanidad.png`
**6 KB**. Son degradés planos. Reproducirlos con `linear-gradient` en CSS es más liviano
todavía (0 bytes, 0 requests), escala a cualquier ancho sin pixelarse y no arrastra un
`<img>` que posicionar. Lo mismo la **banda dorada** (degradé + 3 estrellas en SVG), que es
justamente la que falta en PRODUCCION — **no hace falta pedirla**.

Arte real hay solo cuatro: **hero, frase manifiesto (máscara), cuatro promesas y cierre.**

#### Medición de la conversión (prueba hecha, `quality=80`, tope de 1920 px de ancho)

```
frase manifiesto   932 KB -> 177 KB (alpha)
hero.jpg           509 KB -> 184 KB   2590x1429 -> 1920x1059
imagen de cierre  2765 KB -> 234 KB   2109x1049 -> 1920x955
voces de luz       742 KB ->  30 KB   (candidato a CSS)
la humanidad       901 KB ->   6 KB   (candidato a CSS)
footer             236 KB ->   2 KB   (candidato a CSS)
LOGO                39 KB ->  14 KB
------------------------------------------------
TOTAL             5,98 MB -> 647 KB
```

Descontando los degradés que pasan a CSS y sumando "cuatro promesas" (estimado ~200 KB),
el presupuesto real de imágenes de la home queda en **~800 KB**, de los cuales **solo el
hero (184 KB) bloquea el primer pantallazo**. Muy por debajo de la meta de §6.3.

### 6.1.e Conversión hecha — `public/img/home/`

Los 7 assets de PRODUCCION ya están convertidos y commiteados. `quality=80`, `method=6`,
tope de 1920 px de ancho (no se hace upscale de los que vienen más chicos):

```
hero               2590x1429 -> 1920x1059    509 KB -> 183,6 KB
frase-manifiesto   1440x800  -> 1440x800     932 KB -> 177,5 KB  (alpha verificado)
cierre             2109x1049 -> 1920x955   2.765 KB -> 234,3 KB
cuatro-promesas    1456x816  -> 1456x816   1.517 KB -> 105,0 KB
voces-de-luz       1440x800  -> 1440x800     742 KB ->  30,1 KB
humanidad          1440x800  -> 1440x800     901 KB ->   5,9 KB
footer             1440x270  -> 1440x270     236 KB ->   1,7 KB
------------------------------------------------------------------
TOTAL                                       7,42 MB -> 738 KB
```

Verificado que el alfa de `frase-manifiesto.webp` sobrevivió a la conversión (0 en las
esquinas, 255 en el centro): sigue siendo una máscara, no un rectángulo negro.

**Nota de resolución**: `frase-manifiesto`, `voces-de-luz`, `humanidad` y `footer` quedaron
a 1440 px porque el original no da más. En los tres últimos no importa (son degradés) y en
la máscara tampoco (es un glow difuso, el upscale es invisible). El único que conviene
pedir más grande si se ve blando en pantalla grande es **`cuatro-promesas` (1456 px)**, que
sí tiene detalle.

### 6.1.d Dos versiones del bloque "La humanidad" — cuál vale

- El composite que se mapeó primero (`Homepage_correcciones(1).png`, ya no está en
  Descargas) tenía ese bloque en **crema `#FDF6EE` con botón ghost de borde**.
- `Homepage_redesign_example.png` y **todos** los slides sueltos, incluido el de
  PRODUCCION, lo tienen en **degradé dorado con botón sólido azul**.

Todo lo demás de la página es idéntico entre los dos composites. **Va el dorado** (confirmado por Ignacio el 20/08).

Efecto lateral bueno si queda el dorado: el botón sólido azul sobre fondo dorado invierte
los roles de color del sistema, pero **no inventa colores** — es el mismo `#05125A` de la
base. El bloque sigue rompiendo la regla del fondo oscuro (§3.4) y sigue necesitando
`LightSection`.

### 6.2 Dónde se guardan — esto es lo que decide el gasto
**Los fondos fijos de layout van al repo (`public/img/`), no a Supabase Storage.** Es la
regla que ya tiene el proyecto, y acá aparece el número que la justifica:

| | Supabase free | Vercel free |
|---|---|---|
| Egress / ancho de banda | **5 GB/mes**, compartido con toda la API | ~100 GB/mes |
| Quién lo consume | cada lectura de imagen **y** cada query de la app | solo assets |

Servir 4 imágenes de ~300 KB desde Storage son **1,2 MB por visita**: a las ~4.000 visitas
el proyecto se queda sin egress **y con él se cae también la app**, porque el mismo cupo
paga las queries de `trips`, el login y el panel. Desde `public/` el costo para Supabase es
**cero**.

Compromiso con Multimedia: los slots de `site-content` siguen existiendo para que la
clienta pueda cambiar una imagen, pero el **valor por defecto es el asset del repo**. Sin
fila en `site_content` no hay ni una request a Storage. El override es la excepción, no el
camino normal.

### 6.3 Entrega en el browser
- `next/image` en todas: sirve AVIF/WebP según el navegador y cachea largo.
- **Solo la del hero lleva `priority`**; el resto `loading="lazy"`. Es el LCP de la página.
- `sizes` correcto en cada una (son full-bleed: `100vw`), para que no baje la variante de
  2× en un celular.
- `placeholder="blur"` con un `blurDataURL` chico en el hero: durante los 8 s de zoom no
  puede haber un rectángulo vacío.
- **Ojo con el plan free de Vercel**: tiene tope de imágenes fuente transformadas. Se
  controla teniendo **pocas imágenes distintas** (4 fijas) y no generando variantes de más.
- Ninguna de las 4 imágenes se duplica en dos archivos por recorte: se recorta con CSS
  (`object-position`), como ya hace `TripCover`.

**Meta**: home nueva **por debajo de 1,5 MB** de transferencia en la primera visita, y casi
0 en la segunda (todo cacheado en el CDN de Vercel).

---

### 6.4 Qué se exporta y qué se rehace en HTML (regla del paso 0)

**Julia exporta solo la capa de fondo. Todo lo que sea texto, botón o link se rehace en
HTML encima.** Se le pide cada slide con las capas de contenido escondidas, más los textos
aparte y la referencia de dónde va cada uno.

Un texto quemado en el WebP **no es editable**: no se puede cambiar desde
`/admin/multimedia`, no lo indexa Google, no lo lee un lector de pantalla, no entra en el
`es.json`/`en.json` del paso de i18n, se ve borroso en pantallas retina, no hace reflow en
mobile (escala junto con la imagen) y encima pesa más, porque el detalle de las letras
castiga la compresión. Para corregir una coma habría que volver a Julia y reexportar.

Un botón dibujado en la imagen es peor todavía: **no se puede clickear**, no tiene hover,
no toma foco con el teclado y no navega a ningún lado. Es una foto de un botón.

Además hay un caso donde no existe la opción: la **frase manifiesto** (§5.2) se parte en
dos mitades que entran desde arriba y desde abajo por separado. Eso solo se puede animar si
son dos nodos de texto reales.

- **Sale del slide**: títulos, párrafos, las 4 promesas, los testimonios, "ACCESO
  COMUNIDAD", "UNIRME AL CÍRCULO", el cue "DESCUBRIR".
- **Queda en la imagen**: fondo, figura, partículas, degradés, la máscara de sombra.
- **Las cards de testimonio también son HTML**, no un recorte del slide: tienen que
  **crecer con el texto** (en el mockup los tres testimonios ya miden distinto) y pasar a
  una columna en mobile. Es la utilidad `glass-card` que ya existe en `globals.css`.
- **El cuadrado del avatar del testimonio** se hace como *contenedor*, no como una letra
  suelta: hoy muestra la inicial (`TESTIMONIALS.initial`, que es lo que dibuja el mockup),
  y el día que haya fotos reales de los viajeros pasa a ser un `<Image>` adentro del mismo
  box, sin tocar el layout. Mismo patrón que el avatar del navbar.
- **Única excepción — el logotipo** COSMIC EAGLE: ahí la tipografía *es* la marca, no es
  contenido. Va como imagen con `alt`, como ya está resuelto con `public/logo.png`.

Regla corta: **si tiene texto adentro, o cambia de alto según el contenido, es HTML.** La
imagen es solo lo que va detrás de todo.

De Julia, además del fondo, hace falta la **referencia de estilo** de cada pieza que
rehacemos: opacidad y borde de la card, radio de esquina, color y tracking de los botones.

Los botones ya existen en código: `CtaLink` tiene las dos variantes del mockup (sólida
dorada y ghost de borde). De Julia hace falta la referencia de estilo — color de borde,
radio, tracking del texto en mayúscula — para verificar que coincidan, no el botón
exportado.

---

## 7. Los links del footer, mapeados contra el sitio actual

Footer del mockup vs. rutas que existen hoy:

| Columna | Link del mockup | Ruta | Estado |
|---|---|---|---|
| Explorar | Nosotros | `/nosotros` | ✅ existe |
| Explorar | Experiencias | `/viajes` (¿→ `/experiencias`?) | ✅ existe, ver §3.1 |
| Explorar | Contenidos | `/contenidos` | ✅ existe |
| Legal | Privacidad | `/privacidad` | ⚠️ **no existe la ruta, pero el texto sí**: viene en el anexo del boceto de Sofía (`web-cosmic-journey-ES.md`, 15/08). Es una página de composición pura |
| Legal | Términos de Servicio | — | ❌ no hay ruta **ni texto**. Queda apagado |
| Legal | Contacto | `mailto:` actual o `/contacto` | ⚠️ hoy es un `mailto:`. Decidir si se hace página |
| Legal | Soporte | — | ❌ no hay ruta ni definición. Queda apagado |
| Sintoniza | (newsletter) | `NewsletterForm` | ✅ funciona, no se toca |

Cambios contra `FOOTER_COLUMNS` (`src/lib/constants.ts`): **se caen "Retiros", "E-book" y
"Blog"**; entran "Experiencias" y "Contenidos". Los links sin ruta se siguen pintando
apagados, que es lo que ya hace `Footer.tsx` con `href: null` — no se linkea a `#`.

---

## 8. Plan de trabajo

**Todo va en una rama nueva, `home_rediseño`**, y no se sube a `main` hasta revisarlo
juntos. Ojo: `main` está conectado a Vercel y deploya solo, pero **la rama va a generar una
preview URL propia** — esa es la que se revisa antes de mergear.

> Nota menor: la `ñ` en el nombre de rama funciona en git, pero se escapa feo en URLs y en
> algunas herramientas. Sugerencia: `home-rediseno`. Si preferís la ñ, va la ñ.

| Paso | Qué | Depende de |
|---|---|---|
| 0 | Crear la rama. Recibir la carpeta de slides, convertir a WebP y dimensionar (§6.1) | la carpeta de Julia |
| 1 | Primitivas nuevas en `src/components/ui/`: `QuoteBand` (§5.2), `LightSection` (§3.4), `ImageStatements` (§5.4), **P7** (header con dividers, pendiente desde la entrega original), `GoldDivider` | paso 0 |
| 2 | Secciones de arriba a abajo: hero → frase → "La humanidad" → 4 promesas → Voces de Luz → cierre + banda | paso 1 |
| 3 | Navbar (`Viajes` → `Experiencias`) y footer a 3 columnas con el mapeo de §7 | decisión §3.1 |
| 4 | Slots de Multimedia para las 4 imágenes, con default en el repo (§6.2) | paso 2 |
| 5 | Verificación: `tsc`, lint, `pnpm build`, mobile de los bloques absolutos (hero, 4 promesas, frase), y **medición del peso real** de la home contra la meta de §6.3 | todo |
| 6 | Preview de Vercel + revisión con Ignacio → recién ahí, merge a `main` | paso 5 |

Ya no queda nada bloqueante: las dos definiciones que faltaban (§4 y el dorado de §6.1.d)
se cerraron el 20/08.

---

## 8.b Paso 2 hecho — la home compuesta (20/08)

La página está armada de arriba a abajo y verificada en desktop (1440) y mobile (390) con
capturas reales. Lo que se resolvió mientras se componía:

### Cuatro correcciones que no se veían hasta renderizar

1. **El fondo de "Voces de Luz" no aparecía.** Estaba en `-z-10`, y eso no funciona en este
   sitio: `body` pinta su propio degradé **después** de los descendientes de z negativo del
   contexto raíz, así que la imagen quedaba tapada por el fondo de la página (y además
   `body::before`, el campo de estrellas, ya vive en `z-index: -1`). Regla para cualquier
   sección con imagen de fondo: envoltorio en `z-0` y contenido en `z-10`, **nunca z
   negativo**.
2. **El reflejo dorado salía dos veces.** `cuatro-promesas.webp` y `voces-de-luz.webp` son
   la misma composición partida en dos slides: apiladas repetían el reflejo con una costura
   recta en el medio. Se sacó la imagen de fondo de "Voces de Luz" —el degradé del `body` ya
   trae el azul correcto— y se le puso máscara de desvanecido al pie de las promesas.
   `voces-de-luz.webp` queda **sin usar** en `public/img/home/`.
3. **El zoom del hero le comía la cabeza a la figura.** Escalaba desde el centro y la
   cabeza está cerca del borde superior. `transform-origin: center 28%`.
4. **Las frases de la derecha caían a una palabra por línea.** La sangría estaba como
   `padding` en porcentaje, que se descuenta del ancho del propio párrafo. Va como `margin`
   sobre una caja de ancho fijo.

### Decisiones de composición

- El título de "La humanidad" va en **dos tamaños** (el nombre en `display-lg`, la
  continuación en `headline-lg`): con los dos en el tamaño grande la segunda línea no
  entraba y el bloque caía en tres renglones.
- La **geometría sagrada va en SVG**, no como imagen: es geometría pura, pesa unos cientos
  de bytes, se dibuja nítida en cualquier pantalla y toma el color del bloque.
- El **degradé del footer** (`#05125a` → `#0079b2`, muestreado del slide) también en CSS.
- El CTA de "La humanidad" es **azul sólido sobre el dorado**, invirtiendo los roles de
  color del sistema. No inventa colores: es el mismo `#05125a` de la base.

### Componentes que quedaron sin uso

`PortalsSection`, `AboutSection`, `EbookSection`, `TripsSection` y `ContentSection` ya no
los importa nadie. **No se borraron a propósito**: `PortalsSection` es de la semana pasada y
podría mudarse a `/nosotros`, y el e-book todavía no tiene destino (preguntas 3 y 4 de §9).
`TripsSection` es la que sale por la decisión de §4. Cuando esas preguntas se cierren, se
borran las que no se muden — junto con `PORTAL_ALTS` y `EBOOK_FEATURES` en `constants.ts`.

**La home volvió a ser prerender estático** (`○` en el build), como se esperaba en §4.

---

## 8.c Pasos 3 y 4 hechos (20/08)

### Paso 3 — navbar y footer

Casi todo ya había entrado con el paso 2. Lo que quedó revisado:

- **El navbar coincide con el mockup sin tocarlo**: `Header` ya filtra `/cuenta` del menú
  de escritorio y muestra el CTA "Unirme al círculo" cuando no hay sesión (con sesión lo
  reemplaza por el avatar). Es exactamente `NOSOTROS · EXPERIENCIAS · CONTENIDOS` + CTA.
- **El desplegable Retiros/Ceremonias SE MANTIENE**, aunque el mockup no lo dibuje. Es una
  decisión del 05/08 con motivo escrito, afecta a todas las páginas, y un mockup de la home
  no muestra estados de hover: no alcanza como evidencia para sacarlo. Si se decide
  sacarlo, es un cambio de una línea en `NAV_LINKS`.
- **`HeroSection` se borró.** Ya no lo usaba nadie y encima referenciaba slots que dejaron
  de existir. Su único export vivo, `renderTitle`, se mudó a `PageHero`, que es de donde
  siempre fue: es el renderer del título de P1, no de aquella sección.

### Paso 4 — los slots de Multimedia

El grupo "Inicio" de `src/lib/site-content.ts` se reescribió para la home nueva:

| Slot | Qué edita |
|---|---|
| `home.hero.image` | la portada grande (16/9) |
| `home.frase.left` / `.right` | las dos mitades de la frase manifiesto |
| `home.promesas.image` | el fondo de la figura en meditación (16/9) |
| `home.promesas.1` … `.4` | las cuatro frases |
| `home.cierre.image` | la imagen ancha del final (21/9) |

- **La página sigue siendo `○` (estático)** con los slots conectados: `getSiteContent` lee
  con `unstable_cache` y un cliente sin cookies. Verificado en el build.
- **La máscara de la frase NO es slot** a propósito: no es una foto sino una capa de
  atmósfera con transparencia calzada al degradé del fondo. Cambiarla por una imagen
  cualquiera rompería el efecto en vez de personalizarlo.
- **El copy de "La humanidad" y los testimonios siguen en `constants.ts`.** Son bloques
  largos (título a dos pesos, tres párrafos, tres citas con nombre y país) y hacerlos
  editables pide una pantalla distinta a la de un campo por texto — más parecida a
  `/admin/contenidos` que a Multimedia. Queda como trabajo aparte.
- **El tipado de los slots pagó solo**: al sacar `home.hero.title` y `home.hero.subtitle`,
  `tsc` marcó al instante el componente muerto que todavía los leía.

**Ojo, hay un override cargado que queda huérfano.** `site_content` tiene una sola fila:
`home.about.image`, la foto de "Sobre Cosmic Eagle" que se subió el 18/08. Esa sección no
existe en la home nueva, así que la foto deja de mostrarse. **No se borró nada**: la fila
sigue en la tabla y el archivo en el bucket `site-assets`, así que si el bloque se muda a
otra página el slot vuelve y la foto reaparece.

---

## 9. Preguntas abiertas para Julia / Sofía / Estela

1. ~~¿Dónde van los viajes?~~ **RESUELTO**: van en la sección de viajes, ver §4.
2. ~~¿"Experiencias" es la URL?~~ **RESUELTO**: solo la etiqueta, la ruta sigue en `/viajes`.
3. ¿El carrusel de portales se borra o se muda a otra página?
4. ¿El e-book sale de la home definitivamente? ¿Vive en algún lado?
5. Los testimonios del mockup (Valeria/Uruguay, Claudia/Chile, Andrew/Inglaterra) — ¿son
   reales y publicables con nombre y país? Los de hoy son otros (Valentina, Pablo…).
6. "ACCESO COMUNIDAD" va al login (§5.3). ¿A `/cuenta` (login) o a `/cuenta?modo=registro`
   (registro), que es a donde apunta "Unirme al círculo"? Sigue pendiente que la comunidad
   está fuera de alcance (`docs/CONTEXT.md` §6).
7. ¿La banda dorada y el bloque claro se repiten en las otras páginas o son solo de la home?
8. ¿Hacemos `/privacidad` en esta tanda? El texto ya está escrito (§7).
9. ¿El desplegable Retiros/Ceremonias del navbar se queda o se saca? Por ahora se queda (§8.c).
10. ¿"La humanidad" y los testimonios tienen que ser editables desde el panel? Hoy están en
    código (§8.c).
11. ¿Se corrigió bien "evolcando" → "evocando" en el testimonio de Claudia? (§8.b)

---

## 10. Estado de la rama `home_rediseño`

Seis commits, **revisados en local y aprobados por Ignacio el 20/08**. Sin push: la rama no
existe todavía en GitHub y no hay nada en producción.

```
docs: mapa y plan del rediseno de la home
feat: los assets de la home nueva, convertidos a WebP
docs: cierran las dos definiciones que faltaban del rediseno
feat: las primitivas del rediseno de la home
feat: la home compuesta con el diseno nuevo
feat: los slots de Multimedia de la home nueva, y limpieza del navbar
```

Verificado en cada paso: `tsc`, lint (los 2 errores de `admin/multimedia/SlotEditor.tsx`
son previos y no se tocaron), `pnpm build`, y capturas reales de la página renderizada en
1440 y en 390.

**Sin verificar end-to-end** (requiere sesión de admin, la hace Ignacio): que el grupo
"Inicio" de `/admin/multimedia` liste los slots nuevos y que subir una imagen desde ahí
cambie la home.

### Lo que falta antes de mergear

1. Responder las preguntas abiertas de §9 — ninguna bloquea el código, pero la 3, la 4 y la
   9 deciden qué se borra y qué se muda.
2. Borrar o mudar los cinco componentes que quedaron sin uso (§8.b).
3. Push de la rama → preview de Vercel → revisión de Estela y Sofía → merge a `main`.
