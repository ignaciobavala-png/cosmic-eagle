# Design System — Tarjeta "¿Quieres seguir explorando?" (Cosmic Eagle)

Componente aislado, no una página. Spec técnica completa para portar `tarjeta-continuar-explorando-final.html` a React/Tailwind. Ver también `notas-implementacion-tarjeta-continuar-explorando.txt` para contexto de proceso y decisiones.

## 1. Qué es y cuándo aparece

Modal de "gate" (bloqueo de acceso) que se muestra sobre cualquier página del sitio cuando un usuario anónimo intenta ver contenido que requiere sesión (ej. el detalle de una experiencia). Estructura de capas, de atrás hacia adelante:

1. Página del sitio (lo que sea que esté detrás — no es parte de este componente)
2. Velo oscuro — `rgba(0,0,0,0.4)` sobre toda la pantalla
3. Tarjeta — el modal en sí, centrado

El velo y la tarjeta se muestran/ocultan juntos con un único toggle de clase (`.open` sobre el overlay contenedor).

## 2. Tokens de color (reutiliza los tokens del sitio)

| Variable | Valor | Uso en este componente |
|---|---|---|
| `--azul-oscuro` | `#05125A` | Extremo del degradé de la tarjeta; color de texto de los botones dorados |
| `--azul-claro` | `#0079B3` | Extremo superior del degradé de la tarjeta; color base del botón de cerrar |
| `--dorado-claro` | `#F9D78F` | Título; extremo claro del degradé de los botones |
| `--dorado-oscuro` | `#B3964B` | Extremo oscuro del degradé de los botones |

Color nuevo, específico de este componente (no es token global del sitio, solo se usa en el degradé de la tarjeta):

| Valor | Uso |
|---|---|
| `#0a1a6e` | Punto medio (45%) del degradé de fondo de la tarjeta |

Otros colores puntuales (no son variables, están inline):
- Velo: `rgba(0,0,0,0.4)`
- Texto del cuerpo: `rgba(249,215,143,0.85)` (dorado claro con opacidad)
- Texto de soporte: `rgba(255,246,235,0.75)`, hover `#fff`
- Sombra de la tarjeta: `rgba(0,0,0,0.45)`

## 3. Tipografía

- Título (`.gate-title`): Domine, bold, `clamp(26px, 5vw, 34px)`, line-height 1.25, color dorado claro.
- Botones (`.gate-btn`): Domine, bold, 16px, color azul oscuro.
- Cuerpo (`.gate-text`) y soporte (`.gate-support`): Montserrat (clase `.sans`), 16px y 13px respectivamente.

Mismas familias que el resto del sitio (Domine para headings/botones, Montserrat para cuerpo) — no hay tipografía nueva.

## 4. Estructura y dimensiones

- Overlay: `position:fixed;inset:0`, `z-index:1000`, centrado con flexbox, `padding:24px` (margen de seguridad en viewports chicos).
- Tarjeta: `max-width:440px` (ancho fluido debajo de eso), `border-radius:32px` (26px en mobile ≤480px), `padding:56px 40px 40px` (48px 28px 32px en mobile).
- Botón de cerrar: 36×36px, esquina superior derecha, `top:24px;right:24px`.
- Botones de acción: ancho completo dentro de la tarjeta, `border-radius:50px` (píldora), `padding:16px 20px`, `gap:16px` entre ambos.
- Texto del cuerpo limitado a `max-width:340px` para mantener las líneas cortas y centradas.

### Breakpoint

Un solo breakpoint: `max-width:480px` (ajusta padding/radio de la tarjeta y márgenes internos). No hay versión "tablet" intermedia — se comporta igual entre 480px y cualquier ancho mayor.

## 5. Contenido (copy aprobado)

- Título: "¿Quieres seguir explorando?"
- Cuerpo: "Para explorar los detalles de esta experiencia cósmica, necesitamos conocerte primero."
- Botón 1: "Inicia sesión" → `login.html`
- Botón 2: "Crear cuenta" → `register.html`
- Soporte: "¿Necesitas ayuda? Contacta soporte" (el link "Contacta soporte" hoy apunta a `#` — placeholder, falta el destino real)

## 6. Tabla de animaciones

| Elemento | Trigger | Propiedad(es) | Duración | Easing | Reversible |
|---|---|---|---|---|---|
| Velo (overlay) | clase `.open` agregada/quitada | `opacity` 0→1 | 0.35s | ease | Sí, en ambas direcciones |
| Tarjeta — entrada | clase `.open` en el overlay padre | `transform` (scale 0.92→1, translateY 16px→0) + `opacity` 0→1 | 0.4s (transform) / 0.35s (opacity) | `cubic-bezier(0.2,0.8,0.2,1)` (transform) / ease (opacity) | Sí |
| Botones dorados — hover/tap | `:hover,:active` | `box-shadow` (glow), `transform` (translateY -1px), `filter` (brightness 1.08) | 0.3s | ease | Sí (momentáneo) |
| Botón cerrar — hover/tap | `:hover,:active` | `text-shadow` (glow azul), `transform` (scale 1.12), `color` (#0079B3→#4db8e8) | 0.3s | ease | Sí (momentáneo) |
| Link de soporte — hover/tap | `:hover,:active` | `text-shadow` (glow gris), `color` (→#fff) | 0.3s | ease | Sí (momentáneo) |

Ningún trigger es scroll — todo depende únicamente de la clase `.open` (apertura/cierre) o de estados de interacción (`:hover`/`:active`).

## 7. Especificación de los 3 glows (todos vía `:hover,:active`, sin JS)

1. **Botones "Inicia sesión" / "Crear cuenta" — glow dorado:**
   `box-shadow:0 0 22px rgba(249,215,143,0.75),0 0 44px rgba(249,215,143,0.4)` + `filter:brightness(1.08)` + `translateY(-1px)`.
2. **Botón cerrar (✕) — glow azul:**
   `text-shadow:0 0 14px rgba(0,121,179,0.95),0 0 28px rgba(0,121,179,0.65)` + `color:#4db8e8` + `scale(1.12)`.
3. **"Contacta soporte" — glow gris:**
   `text-shadow:0 0 10px rgba(200,200,200,0.9),0 0 20px rgba(200,200,200,0.55)` + `color:#fff`.

Los tres usan el selector combinado `:hover,:active` — así el mismo CSS cubre hover de mouse en desktop y tap en mobile, sin JS adicional (mismo patrón que ya usan en el resto del sitio, ej. el botón de scroll-to-top).

## 8. Comportamiento / interactividad

- **Apertura:** por ahora no existe un disparador real en el sitio (la página de detalle de experiencia todavía no está diseñada). Al portar, cualquier evento que deba abrir el modal solo necesita agregar la clase `.open` al contenedor del overlay (`#gateOverlay` en el mockup).
- **Cierre:** 3 vías, todas ya implementadas y equivalentes entre sí — click en el botón ✕, click en el velo oscuro (fuera de la tarjeta), tecla Escape. Las tres simplemente quitan la clase `.open`.
- El click dentro de la tarjeta NO cierra el modal (solo el click en el velo, fuera de ella) — implementado comparando `event.target` contra el overlay mismo.

## 9. Accesibilidad

- El botón de cerrar tiene `aria-label="Cerrar"` (no depende solo del carácter ✕ visual).
- Falta (no implementado en el mockup, a considerar al portar): trap de foco dentro del modal mientras está abierto, y devolver el foco al elemento disparador al cerrar.
