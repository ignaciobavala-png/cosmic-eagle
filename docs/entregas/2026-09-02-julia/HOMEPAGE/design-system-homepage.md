# Cosmic Eagle — Design System: Homepage

Extraído directamente del código de `homepage.html` (versión aprobada, con las tres rondas de
correcciones del 1/9/2026 ya aplicadas). Este documento describe **valores exactos** — no
interpretaciones — para que la implementación en Next.js/Tailwind/Framer Motion no diverja del
mockup. Donde algo depende de un asset todavía no provisto (video, imágenes), se marca
explícitamente como pendiente.

---

## 1. Tokens de color

```css
--azul-oscuro:  #05125A
--azul-claro:   #0079B3
--dorado-claro: #F9D78F
--dorado-oscuro:#B3964B
--crema-beige:  #D0C5B4
--crema-claro:  #FFF6EB
```

Colores adicionales usados puntualmente (no son variables en el CSS actual, pero son
intencionales, no accidentes):
- `#020C41` — fondo base de `.about` (fallback detrás de los degradés de sus hijos).
- `#011360` — color de unión entre `.about-statement` y `.scroll-story` (continuidad de degradé).
- `#0a1660` / `#030b38` — extremos del degradé de `.proposito`.
- `#8f8a7d` — color "apagado" de palabras destacadas en el cuerpo de Propósito antes de iluminarse en dorado.
- `#6b551f` — tono oscuro en los extremos de los degradés dorados de Viajes/Cartelera.
- `#7a6329` / `#fbe9c0` — tonos intermedios del degradé de la cartelera.
- Blancos con opacidad: `rgba(255,255,255,0.08)` a `0.35)` — placeholders de imagen, tarjetas de testimonios, textos secundarios sobre fondo oscuro.

**Nota para el desarrollador**: el celeste real del navbar en el mockup es `#0079B3`. Ya está
anotado (por ambos lados) que el código actual usa `#026fab`, ligeramente distinto — pendiente de
alinear.

## 2. Tipografía

- **Domine** (serif, Google Fonts, pesos 400/500/600/700) — títulos, botones, labels con
  mayúsculas, énfasis.
- **Montserrat** (sans, Google Fonts, pesos 300–700) — cuerpo de texto, clase utilitaria `.sans`.
- Fallback de ambas: `Georgia, serif` / `'Helvetica Neue', Arial, sans-serif`. **Si en cualquier
  render aparece Georgia en vez de Domine, es una falla de carga de fuente del entorno, no
  diseño intencional** — confirmado explícitamente con Julia (27/8): la tipografía real del sitio
  es Domine + Montserrat, no Domine + Literata.
- Import usado en el mockup:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Domine:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  ```

**Tamaños clave por sección** (desktop / mobile cuando difiere):
| Elemento | Tamaño | Notas |
|---|---|---|
| About — frase hero (`.about-statement h2`) | `clamp(48px, 9vw, 80px)` | techo bajado de 113px a 80px (1/9) para que la frase actual entre en 2 líneas, no 3 |
| Scroll-story — párrafos (`.story-p`) | `clamp(15px, 1.9vw, 22px)` | |
| Scroll-story — keywords (`.story-keywords span`) | `clamp(24px, 5vw, 58px)` | |
| Cartelera — título (`.cartelera-title`) | 32px | |
| Card — descripción | 13px | `line-clamp: 4` |
| Atmosférica — texto (`.atmos-text`) | 28px desktop / 22px mobile | |
| Propósito — título (`.proposito-title`) | 56px desktop / 34px mobile | |
| Propósito — cuerpo (`.proposito-body`) | 20px desktop / 16px mobile | |
| Sesiones/Viajes — título (`.sv-content h2`) | 34px | |
| Testimonios — título (`.testi-top h2`) | 42px | |
| Tecnología del Alma — título (`.tec-text h2`) | 40px | |
| Cierre — frase (`.cierre-frase`) | 32px desktop / 22px mobile | |

## 3. Breakpoint

Un único breakpoint mobile: **`@media (max-width:768px)`**. No hay tablet intermedio — el sitio
pasa directo de layout desktop a layout mobile en 768px.

## 4. Estructura de página (orden real del DOM)

1. `.navbar` (fixed) + `.mobile-nav` (panel fullscreen, oculto por defecto)
2. `.hero` — banner de video (100vh)
3. `.about` (contiene 3 sub-bloques):
   - `.about-statement` — frase hero editorial (100vh)
   - `.scroll-story` — scroll-scrubbing de texto + keywords (400vh de scroll)
   - `.cartelera-wrap` — carrusel colapsable de experiencias
   - `.scroll-ind` — indicador hacia Atmosférica
4. `.atmos` — banda de imagen + frase (900px fijos)
5. `.proposito` — título + cuerpo + CTA (100vh)
6. `.sesiones-viajes` — dos paneles apilados (`.sesiones` + `.viajes`)
7. `.testimonios` — carrusel de testimonios (100vh)
8. `.tecnologia` — "Tecnología del Alma" (100vh, imagen full-bleed en desktop)
9. `.cierre` — frase de cierre (600px fijos)
10. `.footer` + `.scrolltop` (botón flotante fixed)

## 5. Componentes — spec por sección

### Navbar (`.navbar`)
- `position:fixed`, altura **96px** desktop / **72px** mobile, `z-index:100`.
- Fondo: **opaco al 100%**, `linear-gradient(90deg, #05125A 0%, #0079B3 100%)` — decisión de
  producto ya confirmada (no debe ser `rgba(...)` semitransparente).
- Padding desktop `0 60px`; mobile `0 16px 0 20px`.
- Logo: imagen (`cosmic-eagle-logo.png`, adjunta en este paquete), `height:64px` desktop /
  `40px` mobile.
- Links centrados (`.navbar-center`, `flex:1;justify-content:center`), 13px, letter-spacing 1.5px,
  color crema. Se ocultan en mobile (`display:none`), reemplazados por `.mobile-menu-btn`
  (hamburguesa, visible solo `<769px`).
- CTA (`.navbar-cta`): botón píldora dorado, texto dinámico "UNIRME AL CÍRCULO" ↔ "MI CUENTA"
  según `localStorage.userLoggedIn` (no hay auth real todavía, es un placeholder funcional).
  Oculto en mobile.
- Dropdown "EXPERIENCIAS" (desktop, hover): panel `rgba(5,18,90,0.95)` con 2 items (Sesiones/Viajes),
  transición opacity+translateY 0.4s `cubic-bezier(0.4,0,0.2,1)`.

### Mobile nav (`.mobile-nav`)
- Panel full-screen (`100dvh`), fondo azul oscuro sólido, entra con `translateX(-100%→0)` en 0.3s.
- Items en Domine 16px dorado, con submenu expandible para Experiencias
  (`max-height` 0→200px, 0.3s).
- Botón de cuenta duplicado al pie, mismo texto dinámico que el CTA de desktop.

### Indicadores de scroll
- `.scroll-ind` (círculo 34px + flecha ↓) y `.scroll-ind-labeled` (círculo + label de texto arriba,
  11px letter-spacing 2px) — ambos color dorado, hover `scale(1.2)` + `brightness(0.75)`,
  transición 0.25s.
- `.hero-discover` (usado en Hero): mismo patrón pero con label debajo del ícono, flecha animada
  con `discoverBounce` (keyframe, 1.8s ease-in-out infinite, `translate(3px,3px)` en el 50%).

### Hero (`.hero`)
- 100vh/100dvh, fondo degradé (`linear-gradient(160deg,#0079B3,#05125A 70%)`) — **placeholder
  hasta que Julia provea el video real** (`.hero-videolabel`, texto "[VIDEO BANNER HERO — 5 seg,
  MP4]", debe reemplazarse por un `<video>` real).
- Sin texto propio en el hero — solo el botón "DESCUBRIR" (`.hero-discover`) que hace scroll a `#about`.

### About — 3 sub-bloques
**`.about-statement`** (pantalla 1, 100vh): frase en 2 líneas, línea 1 crema, línea 2 dorada +
itálica. Reveal por frase vía IntersectionObserver (`.line-reveal`, opacity+translateY(40px), 1.6s
ease-out, delay 0.15s en la 2ª línea, mobile 0.9s). **One-shot**: no se revierte al scrollear hacia
arriba (a diferencia del patrón direccional usado en otras páginas — ver sección Animaciones).

**`.scroll-story`** (scroll-scrubbing, 400vh de scroll con `.scroll-story-sticky` en
`position:sticky`): ver sección 6 (Animaciones) para el detalle completo del motor de scroll.

**Cartelera** (`.cartelera-wrap`, colapsable vía `toggleCartelera()`): carrusel horizontal
autoplay (`scrollLeft` keyframe, 22s linear infinite, se pausa en hover desktop vía
`animation-play-state:paused`, se desactiva por completo en mobile con scroll manual). Cards
(`.card`) con tags "Sesión"/"Viaje" + ubicación, descripción (line-clamp 4), footer con
fecha + flecha `↗` en botón redondeado.

### Atmosférica (`.atmos`)
900px fijos (no responsive de alto), imagen placeholder (`.atmos-label`, "[IMAGEN PLACEHOLDER —
full screen, protagonista]" — **pendiente asset real**), texto centrado con reveal one-shot
(opacity+translateY(30px), 1s).

### Propósito (`.proposito`)
100vh, título+línea decorativa+cuerpo+botón. El cuerpo se anima **palabra por palabra, agrupado
por línea real del navegador** (no una línea fija a mano) — ver sección 6. El botón aparece
automáticamente cuando termina la animación del cuerpo (no es un trigger de scroll independiente).

### Sesiones / Viajes (`.sesiones-viajes`)
Dos paneles apilados verticalmente (decisión final tras revertir un intento de disposición lado a
lado que Julia no aprobó), cada uno `min-height:50vh` para sumar exactamente 100vh en desktop.
Fade escalonado simultáneo en ambos paneles al entrar en viewport (título+línea t=0, subtítulo
t=150ms, cuerpo t=300ms, botón t=450ms). Botones con glow+scale en hover/tap — **cuidado**: el
`transform:scale()` del hover necesita `!important` porque una regla posterior
(`.sv-content.animate-in .sv-btn{transform:scale(1)}`) tiene la misma especificidad y gana por
orden de aparición si no se fuerza.

`.symbol-note` (CSS en la hoja de estilos, sin elemento HTML que la use): **código muerto** — fue
un intento de agregar símbolos decorativos de fondo en esta sección, probado y descartado por
decisión visual de Julia. Seguro ignorar/eliminar esta clase al portar.

### Testimonios (`.testimonios`)
100vh, carrusel horizontal con drag-to-scroll manual (mousedown/mousemove, no autoplay). Textos
distintos por página (Home = "Voces de Luz") — confirmado que Home/Sesiones/Viajes de Experiencias
llevan 3 sets de testimonios diferentes, no el mismo repetido.

### Tecnología del Alma (`.tecnologia`)
100vh. **Único componente reusado tal cual, con el mismo nombre de clase, en `contenidos.html`**
(sección "Tecnología Humana y Ciencia del Alma") — cualquier ajuste a este componente debería
replicarse en ambos archivos si se corrige más adelante. Imagen full-bleed absoluta
(`position:absolute;top:0;right:0;width:50vw;height:100vh`) en desktop, oculta en mobile. Fade
escalonado título→imagen (t=0), párrafo1 (t=150ms), párrafo2 (t=300ms), párrafo3 (t=450ms), botón
(t=600ms).

### Cierre (`.cierre`)
600px fijos, frase centrada con reveal one-shot simple (opacity+translateY(30px), 1s).

### Footer (`.footer`) + Scrolltop (`.scrolltop`)
Footer: degradé horizontal azul, 3 columnas (Explorar/Legal/Newsletter) + bottom bar. Logo mismo
archivo que el navbar, `height:60px` desktop / `48px` mobile.
Scrolltop: círculo dorado fijo abajo-derecha (52px), `onclick="window.scrollTo({top:0,behavior:'smooth'})"`,
glow+scale(1.08) en hover/active.

## 6. Animaciones — tabla completa

| Elemento | Trigger | Duración/easing | Delay | Reversible al scrollear hacia arriba |
|---|---|---|---|---|
| `.line-reveal` (About statement) | IntersectionObserver, threshold 0.3, **one-shot** (se desconecta tras disparar) | opacity+translateY(40px), 1.6s ease-out (0.9s mobile) | 0.15s en 2ª línea | **No** — quiere quedar fijo una vez mostrado |
| Scroll-story (párrafos, keywords, botón) | Scroll listener manual (no Framer Motion `useScroll`), recalcula en cada `scroll` con `requestAnimationFrame` throttling | Ver fórmula abajo | — | Sí, completamente ligado al scroll real (`progress` 0→1 mapeado a `-rect.top/(altura-100vh)`) |
| `.atmos-text.in-view` | IntersectionObserver threshold 0.4, one-shot | opacity+translateY(30px), 1s | — | No |
| `.proposito` título/línea | IntersectionObserver threshold 0.3, one-shot | opacity+translateY(30px)/width, 1.6s ease-out | — | No |
| `.proposito-body` (palabra por palabra) | mismo observer que arriba, JS agrupa palabras por línea real (`getBoundingClientRect`) | 900ms por línea | 150ms entre líneas | No |
| `.proposito-btn` | `setTimeout` disparado cuando termina la animación del cuerpo (no por scroll) | opacity+scale+translateY, 0.6s ease-out | calculado: `(nº líneas-1)*150 + 900 + 100` ms | No |
| `.sv-content.animate-in` (Sesiones/Viajes) | IntersectionObserver threshold 0.25, one-shot | opacity 0.8s, línea decorativa width 1.2s | 0/150/300/450ms escalonado | No |
| `.tecnologia.in-view` | IntersectionObserver threshold 0.25, one-shot | opacity 0.8s (texto), 1s (imagen) | 0/150/300/450/600ms escalonado | No |
| `.cierre-frase.in-view` | IntersectionObserver threshold 0.4, one-shot | opacity+translateY(30px), 1s | — | No |
| Carrusel cartelera (`scrollLeft`) | CSS `@keyframes`, autoplay | 22s linear infinite | — | n/a (loop continuo, se pausa en hover) |
| `discoverBounce` (flecha hero-discover) | CSS `@keyframes`, autoplay | 1.8s ease-in-out infinite | — | n/a |

**Motor de scroll-story (el más complejo de portar)**: NO usa Framer Motion ni ninguna librería —
es un listener de `scroll` nativo que calcula `progress = clamp(-rect.top / (altura_total -
100vh), 0, 1)` y aplica estilos inline directamente vía JS en cada frame (`requestAnimationFrame`
throttled). Se divide en 4 fases dentro de ese progreso 0→1:
- **Fase 1** (0 → 0.28): reveal progresivo de 3 párrafos, cada uno con su propia ventana de
  scroll dentro de ese rango, opacity puro sin desplazamiento.
- **Fase 2** (0.28 → 0.55): 7 segmentos de texto se apagan uno a uno en cascada.
- **Fase 3** (0.55 → 0.78): 4 "keywords" se trasladan desde offsets individuales
  (`KEYWORD_START_OFFSETS`, hardcodeados en px) hacia el centro, con `scale(0.6→1)` simultáneo.
- **Fase 4** (evento único en 0.80): el botón CTA aparece/desaparece según se cruce el umbral,
  con su propia transición fija (no ligada al progreso continuo).

**Nota importante para el desarrollador** (cross-referencia a algo que ya diagnosticaron
ustedes mismos, 28/8): el bug de Framer Motion 12 con `ViewTimeline` nativo en secciones
`sticky` muy altas (que ya solucionaron en `use-section-progress.ts`) es exactamente el tipo de
sección que representa `.scroll-story` (400vh) — si deciden reimplementar este motor con Framer
Motion en vez de con un listener manual como el mockup, esa es la sección donde más cuidado hay
que tener.

**Patrón direccional (reversible) usado en Nosotros/Experiencias/Contenidos, NO en Home**: varias
otras páginas del sitio usan un patrón de reveal que SÍ se revierte al scrollear hacia arriba
(clase se remueve solo si `entry.boundingClientRect.top > 0`). **Home no usa este patrón en
ninguna de sus animaciones** — todas las de Home son "one-shot" (se disparan una vez y quedan
así, no vuelven a ocultarse). No portar el comportamiento reversible a Home por error de
copy-paste entre componentes compartidos.

## 7. Assets pendientes (no incluidos en este paquete, a la espera de Julia)

- **Video del Hero** (`.hero-videolabel`): "[VIDEO BANNER HERO — 5 seg, MP4]" — Julia lo provee,
  no arrancar con imagen fija.
- **Imagen de Atmosférica** (`.atmos-label`): "[IMAGEN PLACEHOLDER — full screen, protagonista]".
- **Imagen de Tecnología del Alma** (`.tec-image`): "[IMAGEN PLACEHOLDER]".
- **Imagen de Cierre** (`.cierre-label`): "[IMAGEN PLACEHOLDER — cierre]".
- Los símbolos decorativos de Nosotros (`nos-symbol-1.png`/`nos-symbol-2.png`) ya se entregaron
  en una ronda anterior — no aplican a Homepage, se mencionan acá solo para no duplicar el pedido.

## 8. Asset incluido en este paquete

- `cosmic-eagle-logo.png` (914×267px, PNG con transparencia) — logo real usado en navbar y
  footer (idéntico en ambos lugares, extraído del base64 embebido en el HTML).
