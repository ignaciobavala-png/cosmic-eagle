# Design System — "About" / segunda screen (párrafo animado), Homepage Cosmic Eagle

Spec técnica **final** de `.scroll-story` (la segunda screen de la sección `#about`: fondo de placeholder, párrafo con scroll-scrubbing, lista final de palabras y botón "Explorar experiencias"). Refleja exactamente el comportamiento y los valores del archivo `about-scroll-story-seccion-corregida-v2.html`, ya aprobado. No es un diff — es el estado definitivo a portar, sin distinguir qué vino de una ronda de corrección u otra.

## 1. Estructura general

`.scroll-story` es un contenedor de **400vh de alto** que envuelve un hijo `position:sticky` (`.scroll-story-sticky`, `top:0;height:100vh`) — el efecto de scroll-scrubbing (el contenido reacciona al progreso del scroll en vez de a un timer) se logra leyendo cuánto se movió `.scroll-story` respecto al viewport mientras su hijo sticky permanece fijo en pantalla.

Dentro de `.scroll-story-sticky` conviven, apilados con `z-index`:
1. `.story-media` (`z-index:1`) — fondo full-screen estático.
2. `.story-text` (`z-index:3`) — el párrafo animado.
3. `.story-outcome` (`z-index:3`) — lista final de palabras + botón.

`.scroll-story-sticky` centra verticalmente su contenido (`display:flex;align-items:center`) — esto es relevante porque el ancho de `.story-text` (ver §3) determina cuánto alto ocupa el bloque de texto y, en consecuencia, cuánto margen queda arriba/abajo.

## 2. Fondo (`.story-media`)

Placeholder a pantalla completa, **sin velo oscuro**, mismo tratamiento en mobile y desktop. No tiene animación de entrada/salida propia — está visible todo el tiempo que dura el scroll de esta screen; solo el texto/lista/botón por encima de él se animan.

```css
.story-media{
  position:absolute;inset:0;z-index:1;
  background:linear-gradient(135deg,var(--azul-claro),var(--azul-oscuro)); /* placeholder — reemplazar por <img>/<video> real */
  display:flex;align-items:center;justify-content:center;
  overflow:hidden;
}
.story-media-label{
  color:rgba(255,255,255,0.35);
  font-size:12px;
  text-align:center;
  padding:0 20px;
}
```

```html
<div class="story-media" aria-hidden="true">
  <span class="story-media-label">[IMAGEN / VIDEO DE FONDO — full screen, placeholder]</span>
</div>
```

Al reemplazar por el asset real: usar `<img>` u `<video autoplay muted loop playsinline>` con `object-fit:cover` dentro del mismo contenedor, en lugar del `<span>` de placeholder. Como no hay velo oscuro, la legibilidad del texto blanco/dorado sobre la imagen/video real depende del contraste de ese asset específico — si no alcanza, la decisión de agregar algún tratamiento debe conversarse con Julia (el "sin velo" es una decisión de diseño explícita, no un descuido).

## 3. Párrafo animado (`.story-text`)

```css
.story-text{
  position:relative;z-index:3;
  max-width:820px;
  margin:0 auto;
  padding:0 6vw;
}
.story-p{
  font-family:'Montserrat','Helvetica Neue',Arial,sans-serif;
  font-size:clamp(15px,1.9vw,22px);
  line-height:1.63;
  margin-bottom:22px;
  color:var(--crema-claro);
  opacity:0; /* la opacidad se controla por JS en función del progreso del scroll, sin movimiento */
}
.fade-seg{
  transition:opacity 0.1s linear;
}
.keyword{
  color:var(--dorado-claro);
  font-family:'Domine',Georgia,serif;
  font-style:normal;
  font-weight:700;
}
```

```html
<div class="story-text" id="storyText">
  <p class="story-p">
    <span class="fade-seg" data-i="0">Los seres humanos estamos en constante evolución. A medida que expandimos nuestra </span><span class="keyword">conciencia</span><span class="fade-seg" data-i="1">, comenzamos a descubrir que somos mucho más que nuestra historia personal, nuestra mente o la realidad que percibimos a través de los sentidos.</span>
  </p>
  <p class="story-p">
    <span class="fade-seg" data-i="2">Nuestro trabajo explora este </span><span class="keyword">potencial evolutivo</span><span class="fade-seg" data-i="3"> y la naturaleza multidimensional de la experiencia humana: nuestra capacidad de transformarnos, de acceder a niveles más profundos de inteligencia y de reconectar con la </span><span class="keyword">dimensión del alma</span><span class="fade-seg" data-i="4">.</span>
  </p>
  <p class="story-p">
    <span class="fade-seg" data-i="5">Desde esta perspectiva, la evolución humana pasa a ser parte de un campo de conciencia mucho más amplio, abriendo un camino hacia un conocimiento más profundo, la </span><span class="keyword">sabiduría cósmica</span><span class="fade-seg" data-i="6"> y una comprensión expandida de quiénes y qué somos.</span>
  </p>
</div>
```

Puntos clave:
- `potencial evolutivo`, `dimensión del alma` y `sabiduría cósmica` son cada una **un solo `<span class="keyword">`** (no un span por palabra) — así se mueven y aparecen como una unidad en la animación de la lista final (§4). Si se separaran en spans por palabra, cada palabra se despegaría por separado del párrafo, rompiendo el efecto de "frase que viaja junta".
- `.keyword` usa **Domine bold (700)**, color sólido `#F9D78F` (`--dorado-claro`) — no lleva degradé (el degradé es exclusivo de la lista final, ver §4).
- `max-width:820px` es el ancho de la caja de texto en desktop; en mobile, `padding:0 6vw` la angosta naturalmente según el viewport. Este ancho es también lo que determina cuántas líneas ocupa cada párrafo y, junto con el centrado vertical de `.scroll-story-sticky` (§1), cuánto margen queda arriba/abajo del bloque de texto.

## 4. Lista final de palabras + botón (`.story-outcome`)

`.story-keywords` y `.story-cta` viven dentro de un mismo contenedor flex centrado — el conjunto (lista + gap + botón) queda centrado como un solo bloque dentro de la screen completa, para que el margen superior e inferior queden parejos una vez que el botón aparece.

```css
.story-outcome{
  position:absolute;inset:0;z-index:3;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:40px; /* 59px en mobile — ver media query abajo */
  pointer-events:none;
}
.story-keywords{
  text-align:center;
  opacity:0;
}
.story-keywords span{
  display:block;
  font-family:'Domine',Georgia,serif;
  font-style:normal;
  font-weight:600;
  font-size:32px;
  line-height:47px;
  background:linear-gradient(90deg,#F9D78F,#B3964B,#F9D78F);
  -webkit-background-clip:text;background-clip:text;
  color:transparent;-webkit-text-fill-color:transparent;
  transform:scale(0.6);
  transition:transform 0.1s linear;
}
```

Mobile (`@media max-width:768px`):
```css
.story-outcome{gap:59px;}
/* .story-keywords span no necesita override de tamaño en mobile — el valor base (32px/47px)
   ya es el mismo en ambos breakpoints */
```

```html
<div class="story-outcome">
  <div class="story-keywords" id="storyKeywords">
    <span>Conciencia</span>
    <span>Potencial Evolutivo</span>
    <span>Dimensión del Alma</span>
    <span>Sabiduría Cósmica</span>
  </div>
  <div class="story-cta" id="storyCta">
    <button class="about-btn-ghost" onclick="toggleCartelera()">Explorar experiencias <span class="arrow">↗</span></button>
  </div>
</div>
```

**Degradé de 3 colores por línea:** cada `<span>` es su propio bloque (`display:block`), así que `linear-gradient(90deg,#F9D78F,#B3964B,#F9D78F)` con `background-clip:text` corre de 0% a 100% del ancho de **esa línea específica** — cada línea "repite" el mismo degradé, en vez de que el degradé corra continuo a través de las 4 líneas. Es intencional.

**Este degradé es exclusivo de `.story-keywords span`.** Las frases resaltadas dentro del párrafo (`.keyword`, §3) usan la misma tipografía (Domine bold) pero mantienen su color sólido `#F9D78F`, sin degradé — son dos reglas CSS distintas que conviene no confundir ni fusionar.

**Botón (`.story-cta` / `.about-btn-ghost`):** sin cambios de estilo propio — entra con `opacity`+`transform` (`translateY(20px) scale(0.85)` → estado normal) al agregarse la clase `.in`, controlada por JS según el progreso del scroll (§5).

**Valores de gap/tamaño no medidos con anotación explícita:** el `gap:40px` de desktop se infirió midiendo píxeles de la referencia de Julia y aplicando el mismo factor de escala que arrojaban las medidas explícitas de esa misma imagen. Si en algún momento se dispone del archivo de diseño original (Figma u otro) con el valor exacto, usar ese en vez del inferido acá.

## 5. Motor de animación por scroll (JS)

El progreso de scroll dentro de esta screen se computa así:

```js
function onScroll(){
  const rect = container.getBoundingClientRect();
  const total = container.offsetHeight - window.innerHeight;
  if(total <= 0) return;
  const progress = clamp(-rect.top/total, 0, 1);
  if(progress < PHASE_B_START){
    measureKeywordOffsets();
  }
  update(progress);
}
```

`progress` va de 0 (arranca la screen) a 1 (termina), y se reparte en 4 fases:

| Fase | Rango de `progress` | Qué pasa |
|---|---|---|
| 1 — Reveal de párrafos | `0 → 0.28` | Los 3 párrafos aparecen por opacidad (sin movimiento), cada uno con su propia ventana dentro de este rango. |
| 2 — Fade-out de segmentos | `0.28 → 0.55` | Cada `.fade-seg` (los tramos de texto entre keywords) se apaga de a uno, en orden. |
| 3 — Traslado de keywords | `0.55 → 0.78` | El párrafo completo se desvanece (`.story-text{opacity}` baja a 0) mientras cada frase resaltada "se despega" de su posición real dentro del párrafo y viaja hacia el centro de la pantalla, agrandándose (`scale(0.6)→scale(1)`). |
| 4 — Botón | a partir de `0.80` | El botón aparece (clase `.in`) con su propia transición fija; si el usuario vuelve a subir y el progreso cae por debajo de `0.80`, se oculta con la misma transición en reversa. |

```js
const PHASE1_END = 0.28;
const PHASE_A_END = 0.55;
const PHASE_B_START = 0.55;
const PHASE_B_END = 0.78;
const PHASE_C_TRIGGER = 0.80;
```

### Posición de origen de cada frase (`measureKeywordOffsets`)

Para que cada frase resaltada "se despegue" desde su posición real dentro del párrafo (no desde un punto fijo arbitrario), su posición de origen se mide en vivo con `getBoundingClientRect()` sobre los propios spans `.keyword`, relativa al centro de la pantalla:

```js
const paragraphKeywordEls = Array.from(document.querySelectorAll('#storyText .keyword'));

let KEYWORD_START_OFFSETS = [];
function measureKeywordOffsets(){
  const cx = window.innerWidth/2;
  const cy = window.innerHeight/2;
  KEYWORD_START_OFFSETS = paragraphKeywordEls.map(el=>{
    const r = el.getBoundingClientRect();
    return { x:(r.left+r.width/2)-cx, y:(r.top+r.height/2)-cy };
  });
}
```

Esta función se ejecuta en tres momentos, y **los tres son necesarios** para que la posición sea siempre correcta:

1. **Al cargar la página** (`load` + doble `requestAnimationFrame`) — primer valor disponible, calculado recién cuando fuentes y layout ya se asentaron (evita medir contra el fallback de fuente antes de que Domine/Montserrat carguen).
2. **En cada `resize`** (debounced 150ms) — la posición de cada frase dentro del párrafo cambia con el ancho de pantalla (una frase puede envolver en 1 línea en desktop y en 2 en mobile).
3. **En cada frame de scroll, mientras `progress < PHASE_B_START` (0.55)** — es decir, mientras la Fase 3 todavía no empezó a usar este valor. Esto es necesario porque `.scroll-story-sticky` usa `position:sticky`, y un elemento sticky solo tiene su posición "pegada" final una vez que el scroll efectivamente llegó al punto donde se activa — medir solo en `load` (antes de que el usuario haya scrolleado hasta acá) da coordenadas que corresponden a la posición natural del elemento muy por debajo del viewport, no a su posición real en pantalla. Re-medir en cada frame de scroll mientras el valor todavía no se usa garantiza que, para cuando la Fase 3 arranca, el último valor calculado ya sea el correcto.

**Nota de portabilidad:** si esta lógica se reimplementa en React/Framer Motion (o cualquier motor de scroll-tracking distinto), el punto (3) es el más importante a preservar como principio, no como código literal: cualquier medición de posición real de un elemento (`getBoundingClientRect`, un ref con `useLayoutEffect`, `scroll-timeline` nativo, etc.) que dependa de que un ancestro `sticky`/`fixed` ya esté en su posición final, tiene que ejecutarse — o re-ejecutarse — en un momento en que eso ya sea cierto. Nunca medir eso en el montaje/mount de un componente si ese componente vive lejos del tope de la página; medir de forma perezosa/continua durante el scroll (o al menos la primera vez que el elemento entra en viewport).

### Interpolación de posición y escala (Fase 3)

```js
keywordEls.forEach((el,i)=>{
  const off = KEYWORD_START_OFFSETS[i] || {x:0,y:0};
  const t = bProgress; // 0 = posición de origen (offset medido), 1 = posición final (centro, escala completa)
  const x = off.x * (1-t);
  const y = off.y * (1-t);
  const scale = 0.6 + 0.4*t;
  el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
});
```

Cada frase parte de su posición real medida (`off.x, off.y`) y viaja hacia `(0,0)` — el centro de la pantalla, que es donde vive `.story-outcome` — mientras se agranda de `scale(0.6)` a `scale(1)`, en función de `bProgress` (el progreso normalizado dentro de la Fase 3).

## 6. Verificación

Verificado con Playwright en 1512×858 (desktop) y 390×844 (mobile), sobre `about-scroll-story-seccion-corregida-v2.html`:
- Sin errores de consola/JS reales (el único mensaje es `ERR_TUNNEL_CONNECTION_FAILED` de Google Fonts, esperable en el sandbox de verificación, no un problema del código).
- Reveal de párrafos, fade-out de segmentos, degradé de 3 colores en la lista final (confirmado con muestreo de píxeles), y bloque lista+botón centrado con márgenes superior/inferior parejos.
- Primera oración del párrafo legible desde que se entra a la screen, sin superposición con el placeholder de fondo.
- Cada frase de la lista final se despega visiblemente desde su posición real dentro del párrafo, tanto en desktop como en mobile (confirmado con capturas en varios puntos de `progress`).
- Botón "Explorar experiencias" probado con click real: abre `.cartelera-wrap` sin errores.
