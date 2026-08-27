/**
 * Estilos compartidos de los campos de la pantalla de acceso.
 *
 * Salen de `login.html` / `register.html` (entrega de Julia del 27/08) y los
 * usan los cuatro formularios de la carpeta: ingreso, registro, recuperar clave
 * y clave nueva. Van como constantes y no como componente `<Field>` porque cada
 * formulario arma su campo distinto (el de contraseña lleva el ojito adentro del
 * borde) y envolverlos obligaría a pasar el markup por props.
 *
 * Los colores van literales y no por token: esta pantalla es la única del sitio
 * con fondo azul degradado propio, y los tokens de superficie del sistema
 * (pensados para el fondo oscuro general) quedan invisibles encima.
 */

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

export const submitButton =
  "w-full cursor-pointer rounded-full bg-[linear-gradient(135deg,#f9d78f,#b3964b)] p-4 font-display text-sm font-bold uppercase tracking-[0.07em] text-[#05125a] transition-[filter] duration-250 hover:brightness-110 disabled:cursor-default disabled:opacity-60";

export const formError = "mb-5 text-sm text-[#ffb4a8]";
