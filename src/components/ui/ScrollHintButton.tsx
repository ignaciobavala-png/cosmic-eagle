import { ChevronDown } from "lucide-react";

/**
 * Indicador de scroll "seguí bajando" del mockup de Julia (`.hero-discover`):
 * texto + chevron abajo, anclado al pie de la pantalla, que hace scroll suave
 * hasta una seccion.
 *
 * Es el mismo lenguaje visual que el hint del hero de `PageHero`. Tono claro
 * para fondos oscuros (video, sticky, cierre) y oscuro para los fondos crema
 * de /nosotros.
 */
export function ScrollHintButton({
  label,
  target,
  tone = "dark",
  className = "",
}: {
  label: string;
  /** Ancla de destino (`#nosVideo`, `#somos`, ...). */
  target: string;
  tone?: "dark" | "light";
  className?: string;
}) {
  const color =
    tone === "dark"
      ? "text-[#05125a]/80 hover:text-[#05125a]"
      : "text-[#f9d78f]/85 hover:text-[#f9d78f]";

  return (
    <a
      href={target}
      className={`absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 transition-colors ${color} ${className}`}
    >
      <span className="font-display text-[13px] font-normal uppercase tracking-[0.23em]">
        {label}
      </span>
      <ChevronDown size={18} className="animate-float" />
    </a>
  );
}
