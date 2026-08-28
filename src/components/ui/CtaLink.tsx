import Link from "next/link";

type Variant = "solid" | "ghost";

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
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3 text-label-sm uppercase transition-all duration-300 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
