import Link from "next/link";

type Variant = "solid" | "ghost" | "pill" | "glass";

const VARIANTS: Record<Variant, string> = {
  // CTA solido: oro champagne con texto oscuro (primary-container / on-primary)
  solid:
    "bg-primary-container text-on-primary hover:bg-primary-fixed shadow-[0_0_24px_rgba(249,215,143,0.25)]",
  // "Ghost": borde dorado 1px sobre blur, sin relleno.
  // El texto va en `primary-container` (#f9d78f) y no en el oro de acento
  // `primary-fixed-dim` (#e3c37d): sobre el azul del panel de la home ese
  // oro quedaba en ~4:1, abajo del minimo de 4,5:1. Con este llega a 4,9:1.
  ghost:
    "border border-primary-container/55 text-primary-container backdrop-blur-md hover:border-primary-container hover:text-primary-fixed bg-white/[0.03]",
  // La pildora dorada del mockup de Julia. Es UN solo boton repetido en todo el
  // sitio: `.about-btn-ghost` (Explorar experiencias), `.proposito-btn`,
  // `.tec-btn` y `.navbar-cta` son el mismo diseno y solo cambian el padding.
  // Degrade 135deg del oro claro al oscuro, borde 1.5px del oro claro, texto
  // AZUL en Domine bold con tracking — no lleva `text-on-primary`.
  pill:
    "rounded-full border-[1.5px] border-primary-container bg-[linear-gradient(135deg,#f9d78f,#b3964b)] font-display font-bold tracking-[0.08em] text-[#05125a] transition-[filter,transform] hover:brightness-110",
  // La MISMA pildora en "liquid glass": degrade azul al 50% con desenfoque
  // detras, borde y texto dorados. Es el segundo boton del cierre de /nosotros
  // ("IR MAS PROFUNDO") desde la correccion del 03/09 — antes era el dorado
  // translucido, que junto al principal se leian como dos botones iguales.
  // El brillo de arriba (`inset`) es lo que le da el canto de vidrio.
  glass:
    "rounded-full border-[1.5px] border-primary-container/50 bg-[linear-gradient(135deg,rgba(0,121,179,0.5),rgba(5,18,90,0.5))] font-display font-bold tracking-[0.08em] text-primary-container shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-[10px] hover:brightness-125",
};

/**
 * Boton solido / ghost del sistema.
 *
 * Ojo: `className` NO sirve para cambiar el `display`. La base ya trae
 * `inline-flex`, y Tailwind resuelve el conflicto por el orden en la hoja
 * generada (`.inline-flex` se emite despues de `.hidden`), no por el orden en
 * que se escriben las clases. Pasarle `hidden lg:inline-flex` deja el boton
 * visible siempre. Para mostrarlo/ocultarlo por breakpoint, envolverlo en un
 * contenedor que lleve el `hidden`.
 */
export function CtaLink({
  href,
  children,
  variant = "solid",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 px-7 py-3 text-label-sm uppercase transition-all duration-300 ${variant === "pill" || variant === "glass" ? "" : "rounded-lg"} ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
