/**
 * El lenguaje visual de los formularios y las pantallas del embudo.
 *
 * Sale de `login.html` / `register.html` (entrega de Julia del 27/08), que es la
 * unica pantalla de formulario que ella diseño. Hasta el 05/09 solo la usaban
 * los cuatro formularios de /cuenta y el resto del embudo —el filtro corto, el
 * formulario de salud, "Como pagar" y el panel de viajero— seguia con el
 * sistema anterior: `glass-card` sobre el tramo NEGRO del degrade del `body`.
 * Con el sitio rediseñado en azules claros, esas pantallas se leian como de
 * otra web (pedido de la reunion del 04/09).
 *
 * Tres decisiones que conviene no deshacer:
 *
 * 1. **La seccion pinta su propio fondo azul.** El degrade del `body` termina
 *    en negro al pie y el embudo cae justo ahi. Los dos extremos
 *    (`#05125a` y `#0a1f6e`) son los mismos de la pantalla de acceso: no se
 *    invento ningun hex.
 * 2. **No se llega hasta el celeste `#0079b3`** como sí hace el acceso. Ahí la
 *    seccion mide una pantalla; acá el formulario mide tres, el celeste caeria
 *    en todo el tramo final y el texto blanco al 75% se queda sin contraste
 *    (ver la regla del 28/08: sobre azul claro el oro va `primary-container` y
 *    el texto chico no va translucido).
 * 3. **Los colores van literales y no por token.** Los tokens de superficie del
 *    sistema estan pensados para el fondo oscuro general y sobre este azul
 *    quedan invisibles. Es la misma razon por la que ya iban literales en la
 *    pantalla de acceso.
 */

/** Fondo de las pantallas del embudo. Va en el `<main>`, no en el `<body>`. */
export const funnelSurface =
  "min-h-screen w-full bg-[linear-gradient(160deg,#05125a_0%,#0a1f6e_100%)]";

/** La tarjeta de vidrio claro: reemplaza al `glass-card` oscuro. */
export const panel =
  "rounded-2xl border border-white/[0.14] bg-white/[0.06] shadow-[0_18px_50px_rgba(2,12,65,0.35)] backdrop-blur-xl";

/** Titulo de una tarjeta. El oro sobre azul va `primary-container` (28/08). */
export const panelTitle =
  "font-display text-xl font-bold text-primary-container";

/** Cuerpo de texto dentro de una tarjeta, y su enfasis. */
export const panelBody = "text-white/75";
export const panelStrong = "text-white";

/** Separadores internos: sobre azul, el `outline-variant` del sistema no se ve. */
export const panelDivider = "border-white/[0.12]";

// --- Campos -----------------------------------------------------------------
// Los usan los cuatro formularios de /cuenta (ingreso, registro, recuperar,
// clave nueva) y los dos del embudo (filtro corto y salud). Van como constantes
// y no como un componente `<Field>` porque cada formulario arma su campo
// distinto —el de contraseña lleva el ojito adentro del borde— y envolverlos
// obligaria a pasar el markup por props.

export const fieldWrap = "mb-5";

export const fieldLabel =
  "mb-2 block text-[11px] uppercase tracking-[0.14em] text-white/55";

export const fieldInput =
  "w-full rounded-lg border border-white/[0.18] bg-white/5 px-4 py-3.5 text-[15px] text-white outline-none transition-[border-color,box-shadow,background-color] duration-300 placeholder:text-white/30 focus:border-[#0079b3] focus:bg-white/[0.08] focus:shadow-[0_0_0_4px_rgba(0,121,179,0.28),0_0_26px_rgba(0,121,179,0.5)]";

/** El input de contraseña deja lugar al ojito. */
export const fieldInputPassword = `${fieldInput} pr-12`;

export const fieldToggle =
  "absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center justify-center p-1 text-white/45 transition-colors duration-200 hover:text-white/80";

export const fieldHint = "mt-2 text-xs text-white/45";

/** La pildora dorada, ancho completo: el submit de un formulario. */
export const submitButton =
  "w-full cursor-pointer rounded-full bg-[linear-gradient(135deg,#f9d78f,#b3964b)] p-4 font-display text-sm font-bold uppercase tracking-[0.07em] text-[#05125a] transition-[filter] duration-250 hover:brightness-110 disabled:cursor-default disabled:opacity-60";

/** La misma pildora al ancho de su contenido: un CTA suelto dentro de un panel. */
export const pillButton =
  "inline-flex cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f9d78f,#b3964b)] px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.07em] text-[#05125a] transition-[filter] duration-250 hover:brightness-110 disabled:cursor-default disabled:opacity-60";

/** Su version de contorno, para acciones secundarias (elegir un archivo). */
export const ghostButton =
  "inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary-container/55 px-5 py-2.5 text-sm font-medium text-primary-container transition-colors hover:bg-primary-container/10";

export const formError = "mb-5 text-sm text-[#ffb4a8]";
