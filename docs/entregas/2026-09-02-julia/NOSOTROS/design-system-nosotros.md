# Design System — nosotros.html (Cosmic Eagle)

Spec técnica de la página **Nosotros**, ya aprobada por Julia. Para el agente de desarrollo (Claude) que la porta a Next.js/React/Tailwind. Ver también `notas-implementacion-nosotros.txt` para contexto de proceso y decisiones — leer ambos juntos.

## 0. Aviso importante — CSS heredado sin usar en esta página

Antes de portar cualquier cosa: `nosotros.html` fue construido a partir de una copia del stylesheet base de Home (el archivo que hoy es `homepage.html`), y ese CSS heredado **nunca se limpió**. El archivo contiene bloques completos de estilos que **no se usan en ningún lado del `<body>` de esta página** — son las secciones de Home reproducidas tal cual (Hero, About-statement/editorial, Scroll-story, Cartelera, Atmosférica, Propósito, Sesiones/Viajes, Testimonios, Tecnología del Alma, Cierre "genérico") con sus clases **sin el prefijo `nos-`**.

**No portar ninguna de estas clases** (confirmado que no aparecen en el HTML real de esta página): `.hero`, `.hero-videolabel`, `.scroll-ind`, `.about` / `.about-statement` / `.about-editorial*`, `.line-reveal`, `.scroll-story*`, `.story-keywords`, `.story-cta`, `.about-btn-ghost`, `.cartelera-*`, `.card*`, `.atmos*`, `.proposito*`, `.sesiones`, `.viajes`, `.symbol-note`, `.sv-*`, `.testimonios`, `.testi-*`, `.tecnologia`, `.tec-*`, `.cierre` (sin prefijo, distinto de `.nos-cierre` que sí se usa).

Las clases que **sí** se usan y hay que portar son: todo lo de navbar/mobile-nav (compartido con el resto del sitio), `.hero-discover`/`.discover-arrow` (el botón indicador de scroll, reusado — pero OJO, es distinto de `.scroll-ind`, que es el indicador que usa Home y que Nosotros no usa en ningún lado), y todo el bloque con prefijo `nos-` (`.nos-hero*`, `.nos-enfoque-*`, `.nos-symbol*`, `.nos-video*`, `.nos-about*`, `.nos-cierre*`, `.nos-btn-*`), más `.footer`/`.scrolltop` al final.

Si tienen algún tipo de linter/auditoría de CSS no usado en el pipeline de build, es normal y esperable que marque todo este bloque — es deuda de este mockup en particular, no algo a replicar.

## 1. Estructura de secciones (orden real del DOM)

1. `<nav class="navbar">` + `<div class="mobile-nav">` — compartidos con el resto del sitio, sin cambios respecto a `homepage.html`.
2. `<section class="nos-hero">` — Hero de Nosotros.
3. `<section id="nosEnfoque">` — "Nuestro Enfoque", 3 pantallas internas (`.nos-enfoque-screen1/2/3`).
4. `<section class="nos-video" id="nosVideo">` — video de transición + texto superpuesto.
5. `<section class="nos-about" id="nosAbout">` — "Sobre nosotros", scroll-driven, sticky.
6. `<section class="nos-cierre" id="nosCierre">` — cierre con CTA doble.
7. `<footer class="footer">` — compartido con el resto del sitio, idéntico a `homepage.html`.
8. `<div class="scrolltop">` — botón flotante "volver arriba".

## 2. Tokens de color (globales del sitio, sin cambios)

| Variable | Valor |
|---|---|
| `--azul-oscuro` | `#05125A` |
| `--azul-claro` | `#0079B3` |
| `--dorado-claro` | `#F9D78F` |
| `--dorado-oscuro` | `#B3964B` |
| `--crema-beige` | `#D0C5B4` |
| `--crema-claro` | `#FFF6EB` |

Gradientes específicos de esta página (no son variables, están inline):
- Hero: `linear-gradient(160deg,#0079B3,#05125A 70%)`
- Pantalla 1 de Enfoque: fondo sólido `#FFF7EA`
- Video: velo `#05125A` a `opacity:0.3` sobre fondo `#05125A`
- Cierre: `linear-gradient(135deg,var(--azul-claro),var(--azul-oscuro))` (el placeholder de imagen de fondo)

## 3. Tipografía

Domine (headings, botones) + Montserrat (clase `.sans`, cuerpo) — igual que el resto del sitio. `body{font-family:Georgia,serif}` es el fallback del entorno de mockup, no una fuente intencional (ver nota de tipografía ya cerrada con el equipo de desarrollo en rondas anteriores).

## 4. Breakpoint

Uno solo: `max-width:768px`. Sin punto intermedio tipo tablet.

## 5. Spec por componente

### 5.1 Hero (`.nos-hero`)
- `height:100vh` (`100dvh` en navegadores que lo soportan), gradiente de fondo, contenido centrado.
- Placeholder de imagen/video de fondo (`.nos-hero-media`) — Julia todavía no proveyó el asset real.
- Título (`.nos-hero-title`, Domine bold, `clamp(34px,5.5vw,64px)`) y bajada (`.nos-hero-sub`, Montserrat) son **campos de CMS** (ver nota de desarrollador en el HTML, línea previa al `<h1>`) — no texto fijo, contenido hoy son placeholders `[TITULAR]`/`[BAJADA CORTA]`.
- Reveal: fade+translateY al cargar la página (clase `.in`), no depende de scroll — no hay nada arriba para revertir al volver.
- Botón "CONOCENOS" (`.hero-discover`) hace scroll suave a `#nosEnfoque`.

### 5.2 Nuestro Enfoque (`#nosEnfoque` — 3 pantallas)

**Pantalla 1** (`.nos-enfoque-screen1`, fondo `#FFF7EA`): secuencia de 4 palabras con flechas intercaladas — "Liberar → Recordar → Reconectar → Encarnar" — cada palabra entra con fade + translateY alternado (`dir-up`/`dir-down`, 36px) en cascada (delays de 0.1s a 1.2s, ver tabla de animaciones). Debajo, el símbolo decorativo 1 (fila de 3: lateral+centro+lateral en desktop, solo el centro visible en mobile vía `display:none` en los `.nos-symbol-side`).
- **Mobile**: `justify-content:flex-start` con `padding-top:110px` fijo (reproduce el aire que había antes de "Liberar") y `padding-bottom:0`, `min-height:auto` — importante: NO es `justify-content:center`, fue cambiado a propósito (ver §7, gotcha de layout).

**Pantalla 2** (`.nos-enfoque-screen2`, fondo `--crema-claro`): título "Nuestro enfoque" + línea decorativa + 3 párrafos justificados + frase de cierre en itálica (separada por un borde superior). Reusa visualmente el estilo de "Tecnología del Alma" de Home. Debajo, el símbolo decorativo 2.

**Pantalla 3** (`.nos-enfoque-screen3`, mismo fondo que pantalla 2): título "Nuestro propósito" + línea + 2 párrafos con spans `.hl` resaltados en Domine bold. Termina con el botón "IR MÁS PROFUNDO" (`.hero-discover.nos-enfoque-indicator`) que hace scroll a `#nosVideo`.

**Símbolos decorativos** (`.nos-symbol-row-1`/`-2`, imágenes reales — ver assets adjuntos `nos-symbol-1.png`/`nos-symbol-2.png`, extraídas del base64 embebido, ambas con transparencia):
- Giran continuamente sobre su propio eje, sentido antihorario, 30s por vuelta, infinito (`@keyframes nosSymbolSpin`, `animation:nosSymbolSpin 30s linear infinite`), sin desplazarse ni cambiar de tamaño.
- **Desktop**: `position:absolute`, fila de 3 elementos (lateral — símbolo — lateral) centrada horizontalmente, `top` calculado dinámicamente en JS (ver §6).
- **Mobile**: flujo normal (`position:static`), solo se ve el elemento central (los laterales se ocultan), centrado verticalmente entre su texto de arriba y de abajo vía `margin-top`/`margin-bottom` calculados dinámicamente en JS (ver §6).
- Símbolo 1: 140×117px desktop, 130×109px mobile. Símbolo 2: 160×98px en ambos.
- Símbolo 1 se revela con el `in-view` de su propia pantalla (screen1), con `transition-delay:2.2s` (para no competir visualmente con la animación de las palabras de arriba). Símbolo 2 tiene su **propio** IntersectionObserver independiente (clase `.sym-in`, no depende de ninguna pantalla vecina — ver §7).

### 5.3 Video + velo (`.nos-video`)
- `height:100vh`, placeholder de video de fondo (`.nos-video-media`) + velo oscuro semitransparente (`.nos-video-veil`, `#05125A` a 30% opacity) + un texto centrado personalizable (`#nosVideoText`, hoy `[TEXTO PERSONALIZABLE]`) que aparece con fade simple al entrar en viewport (reversible). Botón "SOBRE NOSOTROS" → scroll a `#nosAbout`.

### 5.4 Sobre nosotros (`.nos-about`) — scroll-driven, sticky
- Contenedor de `height:280vh` (`260vh` en mobile) con un panel interno `position:sticky;top:0;height:100vh` que permanece fijo mientras el usuario scrollea dentro de ese tramo.
- 3 párrafos de texto (`#nosAboutText p`), cada uno revela su propio tramo de scroll (fade + `translateY(30px→0)`), en secuencia, dentro del primer 75% del recorrido del contenedor (`REVEAL_END = 0.75` en el JS) — el 25% restante final es una pausa fija con el texto ya completo, antes de soltar el sticky y pasar a Cierre.
- Es **continuo**, no un disparo único: si el usuario scrollea hacia arriba dentro de ese tramo, los párrafos se desvanecen en orden inverso (dependen de una función de progreso 0→1, recalculada en cada evento de scroll, no de un toggle on/off).
- Botón "CONTINUAR" al final → scroll a `#nosCierre`.

### 5.5 Cierre (`.nos-cierre`)
- `min-height:100vh`, placeholder de imagen de fondo a 40% opacity + overlay de gradiente azul.
- Título (`.nos-cierre-title`, Domine bold, `clamp(28px,5vw,48px)`) es **campo de CMS** — el `<br>` que hoy parte "UN VIAJE HACIA EL / HUMANO LUMINOSO" en 2 líneas es parte del diseño visual, no debe depender de un `<br>` literal si el campo del CMS es de una sola línea larga (ver nota de desarrollador en el HTML).
- Reveal: fade + translateY al entrar en viewport, reversible.
- Dos botones: "Explorar experiencias" (`.nos-btn-glow`, dorado sólido con glow, ya apunta a `homepage.html#sesiones`) y "Ir más profundo" (`.nos-btn-glass`, estilo glass/liquid, sin link real todavía — es un `<button>`, no un `<a>`).

### 5.6 Footer + scrolltop
Idénticos a `homepage.html`, sin cambios — no se documentan de nuevo acá, ver `design-system-homepage.md` si hace falta el detalle.

## 6. `nosCenterSymbol(symbolSel, aboveSel, belowSel, minGap, maxGap)` — centrado dinámico

Función que centra un símbolo decorativo entre el texto de arriba y el de abajo, midiendo el layout real en tiempo de ejecución en vez de usar valores fijos (necesario porque el alto del texto varía según fuente/dispositivo/ancho de columna). Corre al cargar la página y en cada `resize`.

- **Desktop** (símbolo en `position:absolute`): mide la distancia real entre el borde inferior del texto de arriba y el borde superior del texto de abajo, y calcula el `top` exacto para que el símbolo quede a la mitad.
- **Mobile** (símbolo en flujo normal): ajusta `margin-top`/`margin-bottom` mediante 3 mediciones de prueba (una base + dos con un margen de prueba +80px) y resuelve algebraicamente el margen exacto que iguala el espacio de arriba con el de abajo — sin iterar a ciegas.
- Parámetro `minGap`: piso mínimo de distancia (nunca baja de este valor).
- Parámetro `maxGap` (opcional): techo — si el punto de equilibrio natural (arriba=abajo) supera este valor, recalcula para achicarlo lo más posible manteniendo arriba=abajo, sin nunca forzar un `margin-bottom` negativo (estructuralmente imposible).
- **Gotcha de medición importante**: el texto de referencia (arriba/abajo) puede tener su propio `transform`+`transition` de aparición por scroll, todavía sin activar en el momento de esta medición (que corre al cargar la página) — la función neutraliza temporalmente `transform` y `transition` antes de medir (para leer la posición final real, no la transitoria en su estado "oculto") y los restaura después.

Llamadas actuales en la página:
```js
nosCenterSymbol('.nos-symbol-row-1', '.nos-word-sequence', '.nos-enfoque-screen2 .nos-enfoque-title', 95, 95);
nosCenterSymbol('.nos-symbol-row-2', '.nos-enfoque-screen2 .nos-enfoque-close', '.nos-enfoque-screen3 .nos-enfoque-title', 32, 121);
```

## 7. `nosObserveToggle(el, className, threshold)` — reveal direccional por scroll

IntersectionObserver reutilizado en toda la página (pantallas de Enfoque, texto del video, símbolo 2, cierre): agrega `className` al entrar en viewport, y **solo** lo remueve cuando el elemento sale por ABAJO del viewport (`entry.boundingClientRect.top > 0`, es decir el usuario scrolleó hacia ARRIBA). Si sale por ARRIBA (scroll hacia abajo normal), la clase queda puesta — la animación ya reproducida no se revierte en ese sentido. Es decir: reversible solo al volver hacia atrás, nunca al seguir de largo.

Thresholds usados: pantalla 1 y 3 de Enfoque `0.4`, pantalla 2 `0.25`, símbolo 2 `0.6` (propio, no depende de ninguna pantalla vecina — ver razón en el HTML: el símbolo 2 vive visualmente al límite entre pantalla 2 y 3, así que atarlo al `in-view` de cualquiera de las dos es frágil), video/texto `0.4`, cierre `0.3`.

## 8. Tabla de animaciones

| Elemento | Trigger | Duración/Easing | Reversible |
|---|---|---|---|
| Hero (título+bajada) | carga de página | 1.2s ease-out (opacity+translateY) | No (nada que revertir, es lo primero visible) |
| Palabras de Enfoque (pantalla 1) | scroll, `in-view` | 0.9s ease-out, cascada 0.1s→1.2s por palabra | Sí (direccional) |
| Símbolo 1 | scroll, `in-view` de pantalla 1 | 1s ease-out, delay 2.2s | Sí (direccional) |
| Título/línea/párrafos de pantalla 2 y 3 | scroll, `in-view` de su pantalla | título 1s / línea 1.2s / párrafos 0.8s+translateY14px, cascada 0.15s→0.65s | Sí (direccional) |
| Símbolo 2 | scroll, observer propio (`.sym-in`) | 1s ease-out, delay 0.3s | Sí (direccional) |
| Símbolos — rotación continua | automático, siempre | 30s linear infinite, 360° antihorario | N/A (no es reveal) |
| Texto del video | scroll, `in-view` | 1.2s ease-out (solo opacity) | Sí (direccional) |
| Párrafos de "Sobre nosotros" | scroll continuo (progreso 0→1, no in/out binario) | función continua, sin duración fija | Sí, continuo en ambas direcciones |
| Cierre (título+botones) | scroll, `in-view` | 1.2s ease-out (opacity+translateY20px) | Sí (direccional) |
| Botones `.nos-btn-glow`/`.nos-btn-glass` | hover | 0.3s ease (box-shadow/background+translateY) | Sí (momentáneo) |

## 9. Comportamiento / JS a preservar

- `toggleMobileNav()` — mismo patrón que el resto del sitio.
- Botón de cuenta (`#authButton`, mobile-nav): lee `localStorage.getItem('userLoggedIn')` para decidir el texto ("MI CUENTA" vs "UNIRME AL CÍRCULO") — es un placeholder sin backend real, reemplazar por el estado de sesión real de Supabase.
- Los 5 botones de scroll interno (`CONOCENOS`, `IR MÁS PROFUNDO`, `SOBRE NOSOTROS`, `CONTINUAR`) usan `scrollIntoView({behavior:'smooth'})` directo por `onclick` inline — no hay handlers separados en el `<script>`.

## 10. Assets adjuntos

- `nos-symbol-1.png` (320×268px, PNG con transparencia) y `nos-symbol-2.png` (320×195px, PNG con transparencia) — símbolos decorativos reales, extraídos del base64 embebido en el HTML. Son arte final, no placeholders.
- Los placeholders de imagen/video que SÍ siguen pendientes (Julia todavía no los proveyó): fondo del Hero, video de la sección `.nos-video`, imagen de fondo del Cierre. Se pueden dejar como gradiente/color sólido temporal, igual que hace el mockup hoy, hasta que lleguen.
