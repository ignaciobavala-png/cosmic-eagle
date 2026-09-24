import Link from "next/link";

/**
 * EL boton del sistema. Uno solo.
 *
 * Contorno fino, sin relleno, con hover. Es el `.sv-btn` del mockup de Julia —
 * el "Explorar proximas sesiones" del panel de la home — que Sofia eligio el
 * 09/09 y que la organizacion estandarizo para todo el sitio el 15/09: **no
 * hay mas botones rellenados**. Se fueron la pildora dorada (`pill`), la de
 * vidrio (`glass`), el oro solido (`solid`) y el `ghost`.
 *
 * Por eso ya no hay prop `variant`: si aparece un boton que necesita otra
 * forma, es una conversacion con ellas, no una variante nueva acá.
 *
 * El color lo elige `tone` y NO se pasa por `className`: el mismo boton vive
 * sobre el panel azul y sobre el dorado, y el contorno, el relleno del hover y
 * el glow tienen que seguir al texto los tres juntos. Ademas, dos utilidades
 * de color en la misma propiedad las resuelve el orden de la hoja generada y
 * no el orden en que se escriben (la trampa que ya salio cuatro veces en este
 * proyecto), asi que esto se decide adentro del componente.
 */
export type CtaTone = "gold" | "dark";

/**
 * Contorno, color y hover del boton, en un solo lugar. Lo exporta porque
 * `Collapsible` dibuja el mismo boton con un `<button>` en vez de un link
 * (abre un panel, no navega) y tiene que verse identico.
 */
export const CTA_TONES: Record<CtaTone, string> = {
  // Dorado sobre fondo oscuro o sobre imagen: el caso normal.
  // Brillo del hover subido a pedido de Sofia (24/09: "subir el brillo a los
  // botones, shining un poquito mas fuerte"): de 0,38 a 0,55 de opacidad y el
  // radio de difusion de 26 a 34px.
  gold: "border-primary-container/70 text-primary-container hover:border-primary-container hover:bg-primary-container/10 hover:shadow-[0_0_34px_rgba(249,215,143,0.55)]",
  // Azul sobre el panel dorado y sobre la franja crema.
  //
  // Ojo con el glow: va en el BLANCO CALIDO del sistema (`primary`, #fff6eb),
  // no en el azul del borde. Un halo azul sobre el panel dorado no se lee como
  // luz sino como una sombra sucia — el brillo tiene que ser luz, y la luz no
  // es del color del trazo. El tono `gold` puede darse el lujo de brillar en su
  // propio color porque el oro ya ES la luz sobre el fondo oscuro.
  //
  // Y por lo mismo este tono **no lleva relleno en el hover**: el 10% de azul
  // que lleva el dorado, sobre el panel dorado oscurecia el interior del boton
  // justo mientras el borde se enciende. Aca el hover son el trazo, el brillo
  // y la escala. Tampoco sirve rellenarlo de blanco: el mismo boton vive sobre
  // la franja crema, donde un relleno claro no se ve.
  dark: "border-[#05125a]/70 text-[#05125a] hover:border-[#05125a] hover:shadow-[0_0_28px_rgba(255,246,235,0.85)]",
};

/**
 * Ojo: `className` NO sirve para cambiar el `display` ni el color. La base ya
 * trae `inline-flex`, y Tailwind resuelve el conflicto por el orden en la hoja
 * generada (`.inline-flex` se emite despues de `.hidden`), no por el orden en
 * que se escriben las clases. Pasarle `hidden lg:inline-flex` deja el boton
 * visible siempre. Para mostrarlo/ocultarlo por breakpoint, envolverlo en un
 * contenedor que lleve el `hidden`.
 */
/**
 * `sm` es el pedido puntual de Sofia del 24/09 para el navbar ("la
 * circunferencia del botón un poquito más pequeña, más delicado"): mismo
 * botón, borde más fino y menos padding. Sigue siendo EL botón del sistema —
 * no una forma nueva, un tamaño más para donde el contorno de 1.5px se lee
 * pesado en una barra angosta.
 */
export type CtaSize = "md" | "sm";

const CTA_SIZES: Record<CtaSize, string> = {
  md: "border-[1.5px] px-7 py-3",
  sm: "border px-5 py-2",
};

export function CtaLink({
  href,
  children,
  tone = "gold",
  size = "md",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  tone?: CtaTone;
  size?: CtaSize;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-display text-label-sm uppercase tracking-[0.038em] transition-[color,background-color,border-color,box-shadow,transform] duration-[250ms] hover:scale-[1.04] ${CTA_SIZES[size]} ${CTA_TONES[tone]} ${className}`}
    >
      {children}
    </Link>
  );
}
