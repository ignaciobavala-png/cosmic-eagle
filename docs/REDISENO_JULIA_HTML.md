# Rediseño de Julia en HTML — análisis de encaje (2026-08-27)

Julia entregó **tres HTML autocontenidos** (ella también trabaja con Claude ahora), en
`~/Descargas`, **fuera del repo**:

| Archivo | Peso | Ruta a la que corresponde |
|---|---|---|
| `HOMEPAGE.html` | 127 KB | `/` |
| `EXPERIENCIAS.html` | 125 KB | `/viajes` (el paraguas) |
| `NOSOTROS.html` | 218 KB | `/nosotros` |

De cada archivo, **67 KB son el logo en base64 repetido dos veces** (navbar + footer). Ese
asset ya lo tenemos en `public/logo.png`: no hay que extraer nada.

**No mandó `/contenidos`** (el navbar linkea igual), ni `/cuenta`, ni el detalle de un
viaje. O sea que el rediseño cubre 3 de las ~7 pantallas públicas.

Este documento es el paso previo a tocar código: qué matchea con lo que ya está construido,
qué no, y cómo se enganchan las imágenes que hoy carga la clienta desde `/admin/multimedia`
con la configuración nueva de secciones.

---

## 1. Lo que los tres comparten (y es lo primero a construir)

Los tres HTML repiten **el mismo bloque de CSS base** copiado y pegado: navbar, drawer
mobile, footer, `.card`, `.carousel-track`, `.testi-card`, `.hero-discover`. En el repo eso
ya son componentes compartidos, así que se implementa **una vez**.

### 1.a Paleta

```
--azul-oscuro:#05125A   --azul-claro:#0079B3
--dorado-claro:#F9D78F  --dorado-oscuro:#B3964B
--crema-claro:#FFF6EB   --crema-beige:#D0C5B4
```

| Token de Julia | Token nuestro (`globals.css`) | ¿Matchea? |
|---|---|---|
| `--dorado-claro #F9D78F` | `--color-primary-container #f9d78f` | **idéntico** |
| `--dorado-oscuro #B3964B` | base del `glass-card` (`#b3964b`) | **idéntico** |
| `--crema-claro #FFF6EB` | `--color-primary #fff6eb` | **idéntico** |
| `--azul-oscuro #05125A` | el `#05125a` del navbar del 20/08 | **idéntico** |
| `--azul-claro #0079B3` | el `#026fab` del navbar | casi (corrige el tono) |
| — | `--color-surface #131410` (base cálida negra) | **no existe más** |

**El cambio de fondo es el trabajo grande de CSS.** Hoy `globals.css` pinta un degradé de
documento completo en `body` (azul arriba → negro abajo) más un campo de estrellas de 5 capas
en `body::before`. En el diseño nuevo **cada sección trae su propio degradé azul** y no hay
campo de estrellas global. Hay que neutralizar el fondo de `body` y pasar el color a las
secciones — y ojo con el comentario que ya está en `globals.css` sobre por qué `html` lleva
`background-color`: esa razón desaparece junto con el degradé.

Además `NOSOTROS.html` trae la **primera sección de fondo claro** del sitio (`#FFF7EA`). Con
el fondo global hoy vigente eso ni se puede hacer.

### 1.b Tipografía — hay que preguntarle

Julia **precarga Domine + Montserrat** pero después escribe `body{font-family:Georgia,serif}`
y `h1,h2,h3{font-family:Georgia,serif}`; Montserrat entra sólo por la clase `.sans`. O sea
que el mockup que ella miró está renderizado en **Georgia**, no en Domine.

Hoy tenemos **Domine (headings) + Literata (body)**. La lectura razonable es: headings Domine
(Georgia era el fallback), body **Montserrat** en vez de Literata. **Confirmarlo con ella
antes de tocar `layout.tsx`** — es un cambio que se ve en todo el sitio, incluido el panel.

### 1.c Navbar

Matchea casi 1:1 con `Header.tsx`: logo a la izquierda, Nosotros / Experiencias (con
desplegable) / Contenidos al centro, CTA "UNIRME AL CÍRCULO" a la derecha, drawer mobile con
submenú expandible. Diferencias reales:

1. **Vuelve a ser translúcido** (`rgba(...,0.8)`), después de que el 20/08 lo pasáramos a
   opaco. Si se adopta, vuelve el problema que resolvimos entonces: el `pt-16 lg:pt-21` de
   todos los `main` deja de tener sentido y los heros tienen que volver a pasar por debajo
   con su oscurecido superior. **Decisión de ella, pero hay que avisarle qué implica.**
2. Alto **96 px** (hoy 84 px / `h-21`), logo 64 px (hoy `h-14`).
3. **El desplegable pasa a llamarse SESIONES / VIAJES**, no Ceremonias / Retiros. Es la
   nomenclatura de Sofía (`Sesión Cósmica` = `type=ceremonia`, `Viaje Cósmico` = `type=retiro`).
   Eso toca `TRIP_TYPES` en `constants.ts` — **etiquetas y `slug` de la URL**, no el enum de
   la base. Es el mismo movimiento que hicimos con "Viajes → Experiencias": cambia el rótulo,
   no el dato.
4. **No hay link "Mi Cuenta" en el nav.** El CTA muta: `UNIRME AL CÍRCULO` sin sesión,
   `MI CUENTA →` con sesión (ella lo dejó cableado a `localStorage`, con la nota de "cuando
   exista backend"). Hoy tenemos las dos cosas: el link con avatar **y** el CTA. Hay que
   elegir; lo de ella es más limpio y ya lo resuelve `onAuthStateChange`.

### 1.d Footer

Matchea con `Footer.tsx`: logo + EXPLORAR + LEGAL + SINTONIZA (input de newsletter) + barra
`© 2026 Cosmic Eagle Journey / I.VAVALA`. Cambia el fondo a degradé horizontal
`#05125A → #0079B3`. Los links de LEGAL (Privacidad, Términos, Contacto, Soporte) siguen sin
ruta — se mantienen apagados como hoy.

### 1.e Tarjeta de viaje

La `.card` de Julia y nuestro `TripCard` piden **exactamente los mismos campos**: badge de
tipo, ubicación en mayúscula, título, descripción, fecha, flecha. Con un detalle: ella escribe
la ubicación como **"BUENOS AIRES, ARGENTINA"**, o sea ciudad + país separados — que es
justo el campo que falta (hoy `trips.location` es texto libre; está anotado como pendiente
desde el 15/08).

---

## 2. HOMEPAGE — contra la home que salió a producción el 21/08

**Este es el punto delicado: la home actual tiene 6 días en producción y es la que se muestra
en las reuniones.** El rediseño de Julia la reemplaza casi entera.

| # | Sección nueva | ¿Existe hoy? |
|---|---|---|
| 1 | Hero full-screen — **VIDEO MP4 de 5 s** + botón DESCUBRIR | `ImmersiveHero`, con **imagen** |
| 2 | About: statement "Somos mucho más que nuestra *historia*" + **scroll-story sticky de 400vh** (párrafos que se encienden palabra por palabra, keywords al costado) | **nuevo** |
| 2b | **Cartelera de próximos viajes desplegable** dentro de About (carrusel horizontal de cards) | **vuelve** algo que sacamos el 20/08 |
| 3 | Atmosférica: imagen full-screen + texto centrado | **nuevo** |
| 4 | Nuestro propósito (título + línea + cuerpo con highlight + botón) | **nuevo** en la home |
| 5 | Panel doble Sesiones Cósmicas (azul) / Viajes Cósmicos (dorado), lado a lado | **nuevo** |
| 6 | Voces de Luz — carrusel de 9 testimonios + imagen atmosférica al pie | `TestimonialsSection` ✔ |
| 7 | Tecnología del Alma — texto + imagen, botón IR MÁS PROFUNDO | **nuevo** (es la puerta a `/contenidos`) |
| 8 | Cierre — imagen + "Un viaje hacia el Humano Luminoso" | `ClosingBanner` ✔ **idéntico** |

**Lo que desaparece de la home actual:**

- `QuoteBand` — la frase manifiesto partida en dos con la máscara `frase-manifiesto.webp`.
- `HumanitySection` — el bloque dorado "La humanidad". **Es copy de la clienta**: si se va de
  la home, hay que decidir a dónde va, no perderlo.
- `ImageStatements` — las cuatro promesas sobre `cuatro-promesas.webp`.
- `GoldDivider` — la banda dorada del pie (el degradé pasa al footer).

**Lo que hay que discutir, no implementar de una:**

1. **Los viajes vuelven a la home** (la cartelera del punto 2b). El 20/08 los sacamos por
   decisión tuya, y el efecto lateral fue que la home volvió a ser **prerender estático (`○`)**:
   se sirve del CDN y no gasta egress de Supabase. Con la cartelera vuelve a consultar `trips`.
   Se puede conservar el estático con revalidación por tiempo (ISR), pero es una decisión, no
   un detalle.
2. **Video de fondo.** Hoy el sitio no sirve video: `site-assets` + `compressImage` (canvas)
   son sólo imágenes. Un MP4 de hero necesita bucket propio, `poster`, `muted/loop/playsinline`,
   y un tope de peso — un video mal pesado tira el LCP al piso, justo en la primera pantalla.
   **Y no tenemos el video**: Julia dejó el placeholder.
3. El scroll-story de 400vh sticky es el efecto más caro de la entrega, y es el segundo
   bloque de la página. Se hace, pero conviene medirlo en mobile.

---

## 3. EXPERIENCIAS — contra `/viajes`

| Sección nueva | ¿Existe hoy? |
|---|---|
| Hero **video** "Portales de Transformación" + EXPLORAR | `PageHero` con imagen |
| About Experiencias: imagen full + velo + 3 párrafos con highlights | **nuevo** (el copy ya viene escrito) |
| Bloque **Sesiones Cósmicas** + cartelera desplegable + testimonios "Nuestros Sanadores" | parcial |
| Banner separador: imagen + frase larga | ≈ `CallBand` |
| Bloque **Viajes Cósmicos** + cartelera desplegable + testimonios "Nuestros Viajeros" | parcial |
| **Salud y Seguridad** (3 párrafos) | **nuevo** — el texto ya lo escribió ella |
| Footer | ✔ |

**El cambio de fondo de la página**: hoy `/viajes` es *una grilla con filtros*
(`?tipo=retiros|ceremonias`, chips Todos/Retiros/Ceremonias). En el diseño nuevo son **dos
bloques narrativos con ancla propia** (`#sesiones`, `#viajes` — a donde ya apunta el
desplegable del navbar) y el calendario de cada uno es un **carrusel horizontal que se
despliega al tocar el botón**. El filtro por querystring desaparece; queda un "VER MÁS ➤" que
necesita destino (probablemente el listado completo del tipo).

Los datos son los mismos (`trips` filtrado por `type`), así que el backend no se toca: es
composición. Lo que sí es nuevo es **testimonios por tipo de experiencia** — hoy los
testimonios son constantes en `constants.ts`, sin tabla ni panel. Si Julia los quiere en tres
lugares distintos (home, sesiones, viajes) con textos distintos, ahí aparece la necesidad de
cargarlos desde el admin, como hicimos con `articles`.

---

## 4. NOSOTROS — contra `/nosotros`

| Sección nueva | ¿Existe hoy? |
|---|---|
| Hero imagen + `[TITULAR]` + `[BAJADA CORTA]` | `PageHero` ✔ — **y los dos textos ya son slots editables** |
| Enfoque, pantalla 1: **fondo crema `#FFF7EA`**, secuencia `Liberar → Recordar → Reconectar → Encarnar` + filas de símbolos | **nuevo** |
| Enfoque, pantalla 2: "Nuestro enfoque" + 4 párrafos + frase de cierre | **nuevo** (copy nuevo, largo, de la clienta) |
| Enfoque, pantalla 3: "Nuestro propósito" | **nuevo** |
| **Video** full-screen + velo + texto personalizable | **nuevo** |
| About sticky: 3 párrafos ("Somos investigadores y exploradores…") | ≈ `DocumentCard`, otro copy |
| Cierre: imagen + "UN VIAJE HACIA EL HUMANO LUMINOSO" + 2 botones | `ClosingSection` ✔ |

**Lo que desaparece: los dos `FeatureBlock` + `DocumentCard`** — "Un camino de Evolución
Consciente" y todo el bloque de metodología (hongos, psilocibina, dosis, regeneración
neuronal). **Ese texto es de la clienta y es el único lugar del sitio donde se explica qué se
usa en las ceremonias.** No se borra sin preguntar: o se muda (¿`/contenidos`? ¿el detalle de
cada viaje? ¿una FAQ?) o Julia lo omitió sin darse cuenta.

Los símbolos de las dos filas están marcados por ella como **"pendiente versión final de la
diseñadora"** — o sea que ella misma sabe que falta ese asset.

---

## 5. Cómo se unen las imágenes que ya tenemos con la configuración nueva

**El mecanismo de unión ya existe y no hay que inventarlo: el registro de slots**
(`src/lib/site-content.ts`). El código declara qué slots hay y cuál es el asset por defecto
del repo; `site_content` sólo guarda lo que la clienta subió. Entonces la regla para portar
el rediseño es:

> Cada `[IMAGEN PLACEHOLDER]` / `[VIDEO]` / `[TEXTO ...]` de los HTML de Julia se convierte en
> un slot del registro, con `fallback` apuntando al asset que ya tenemos en `public/img/`.

Y de ahí sale lo único que hay que cuidar de verdad:

> **La `key` del slot es el contrato con lo que la clienta ya subió.** Si una sección
> sobrevive al rediseño, **se conserva la key** y su imagen aparece sola en el diseño nuevo.
> Si se renombra, la fila queda huérfana y la imagen desaparece del sitio sin avisar.

### 5.a Slots que se conservan tal cual (la imagen cargada sigue viva)

| Key | Dónde cae en el diseño nuevo |
|---|---|
| `home.hero.image` | hero de la home — **pasa a ser el `poster` del video** (y el fallback si no hay video) |
| `home.cierre.image` | sección Cierre de la home — **sin cambios, es idéntica** |
| `nosotros.hero.image` / `.title` / `.subtitle` | hero de Nosotros — Julia dejó `[TITULAR]`/`[BAJADA]` justo ahí |
| `viajes.hero.image` | hero de Experiencias (poster del video) |
| `contenidos.hero.*` | intacto, esa página no cambia |

### 5.b Slots que quedan huérfanos (y el asset que libera cada uno)

| Key | Asset | Destino sugerido |
|---|---|---|
| `home.frase.left` / `.right` | `frase-manifiesto.webp` (182 KB) | el texto muere con `QuoteBand`; la **máscara sirve como fondo de la sección atmosférica** de la home |
| `home.promesas.image` + `.1`–`.4` | `cuatro-promesas.webp` (107 KB) | candidata natural a la **imagen de "Tecnología del Alma"** o a la atmosférica |
| `nosotros.proposito.image` | `nosotros-proposito.webp` | libre → **imagen de "About Experiencias"** |
| `nosotros.metodologia.image` | `nosotros-metodologia.webp` | libre → **cierre de Nosotros** |
| `home.about.image` | (subida por la clienta) | ya estaba huérfana desde el 20/08 |

**No borrar las filas huérfanas de `site_content`** — mismo criterio que aplicamos el 20/08:
si el bloque vuelve, la imagen vuelve con él.

### 5.c Assets del repo → hueco nuevo

| Asset hoy | Peso | Hueco del diseño nuevo |
|---|---|---|
| `home/hero.webp` | 188 KB | hero home (poster) |
| `home/cierre.webp` | 240 KB | cierre home ✔ mismo lugar |
| `home/voces-de-luz.webp` | 31 KB | **`.testi-bottom-img`** — la imagen atmosférica al pie de Voces de Luz ✔ mismo lugar |
| `home/cuatro-promesas.webp` | 107 KB | Tecnología del Alma / atmosférica |
| `home/frase-manifiesto.webp` | 182 KB | atmosférica de la home |
| `hero-viajes.webp` | 164 KB | hero de Experiencias (poster) |
| `almas-particulas.webp` | 137 KB | **banner separador** de Experiencias |
| `nosotros-proposito.webp` | 76 KB | About Experiencias |
| `nosotros-metodologia.webp` | 54 KB | cierre de Nosotros |
| `portal-1/2/3.webp` | 265 KB | quedaron sin uso al salir `PortalsSection`; sirven de relleno de las carteleras |
| `home/humanidad.webp`, `home/footer.webp` | 8 KB | ya resueltos en CSS, se pueden borrar |

**Balance: alcanzan.** Con lo que hay en `public/img/` se cubren todos los huecos de imagen
de las tres páginas. **Lo que NO tenemos es video** (3 placeholders: hero home, hero
experiencias, video Nosotros) **ni el patrón de símbolos de Nosotros** — los dos los tiene
que entregar Julia.

### 5.d Slots nuevos que habría que declarar

`home.atmos.image` + `home.atmos.text`, `home.tecnologia.image`, `home.testi.image`,
`viajes.about.image`, `viajes.banner.image` + `.text`, `nosotros.video.*`,
`nosotros.cierre.image`. Todos sin migración: el registro vive en el código.

---

## 6. Qué componentes sobreviven

**Se reusan:** `Header`, `Footer`, `BackToTop`, `NewsletterForm`, `TripCard`, `TripCover`,
`ImmersiveHero`, `PageHero`, `ClosingBanner`, `ClosingSection`, `SectionHeading` (P7),
`Reveal`, `CtaLink`, `TestimonialsSection`.

**Quedan sin uso en las 3 páginas nuevas:** `QuoteBand`, `ImageStatements`, `HumanitySection`,
`GoldDivider`, `FeatureBlock`, `DocumentCard`, `CallBand` — más los cuatro que ya estaban sin
uso desde el 20/08 (`PortalsSection`, `AboutSection`, `EbookSection`, `TripsSection`).
**No borrar todavía**: varios cargan copy de la clienta que el rediseño no reubica (§2 y §4).

**Nuevos a construir:** scroll-story sticky, cartelera desplegable con carrusel, panel doble
Sesiones/Viajes, secuencia de palabras con símbolos, sección de video, bloque de texto sticky.

El JS de Julia es todo `IntersectionObserver` + toggles de clase, con comentarios que
explican los bugs que ya resolvió (el sticky que se superponía al carrusel, el indicador de
scroll que quedaba en el medio, esperar al `load` antes de observar). **Vale leerlos antes de
reescribir en Framer Motion** — son problemas reales que se van a repetir. Falta agregar
`prefers-reduced-motion`, que ella no contempló.

---

## 7. Decisiones que hacen falta antes de escribir código

**Para Julia:**
1. ¿Headings en Domine o realmente en Georgia? ¿Body a Montserrat?
2. El navbar vuelve a ser translúcido — ¿es a propósito? (rompe el ajuste del 20/08)
3. Faltan: los 3 videos, el patrón de símbolos de Nosotros, y el diseño de `/contenidos`,
   `/cuenta` y el detalle de un viaje.

**Para la clienta / Sofía:**
4. ¿A dónde va el copy que el rediseño deja afuera? ("La humanidad" de la home; metodología,
   hongos y psilocibina de Nosotros).
5. Los testimonios pasan a ser tres juegos distintos (home / sanadores / viajeros): ¿se cargan
   desde el panel, como los artículos?
6. Rótulos: ¿el sitio entero pasa a decir Sesiones/Viajes en vez de Ceremonias/Retiros?

**Tuyas:**
7. Los viajes vuelven a la home (cartelera) → la home deja de ser estática. ¿Va?
8. Video de fondo: bucket, tope de peso y `poster` — o se difiere y arrancamos con la imagen
   que ya tenemos en los tres heros.
9. ¿Se rehace página por página sobre la rama `refactoring` (Nosotros primero, que es la de
   menos riesgo) o las tres juntas? La home es la que está en producción y en las reuniones.
