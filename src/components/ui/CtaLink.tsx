import Link from "next/link";

type Variant = "solid" | "ghost";

const VARIANTS: Record<Variant, string> = {
  // CTA solido: oro champagne con texto oscuro (primary-container / on-primary)
  solid:
    "bg-primary-container text-on-primary hover:bg-primary-fixed shadow-[0_0_24px_rgba(249,215,143,0.25)]",
  // "Ghost": borde dorado 1px sobre blur, sin relleno
  ghost:
    "border border-primary-fixed-dim/45 text-primary-fixed-dim backdrop-blur-md hover:border-primary-fixed-dim hover:text-primary-fixed bg-white/[0.03]",
};

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
