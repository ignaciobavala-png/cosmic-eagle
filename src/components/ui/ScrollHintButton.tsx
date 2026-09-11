import { ChevronDown } from "lucide-react";

/**
 * Indicador de scroll "seguí bajando" del mockup de Julia (`.hero-discover`):
 * texto + chevron abajo, anclado al pie de la pantalla, que hace scroll suave
 * hasta una seccion.
 *
 * Es el mismo lenguaje visual que el hint del hero de `PageHero`. Tono claro
 * para fondos oscuros (video, sticky, cierre) y oscuro para los fondos crema
 * de /nosotros.
 *
 * **Es `absolute`, o sea que no ocupa lugar**: la seccion que lo lleva tiene
 * que reservarle el hueco con su propio padding inferior, o en mobile —donde el
 * texto llega hasta el pie— le cae encima al ultimo parrafo. Mide 46px de alto
 * mas lo que diga `bottomClassName`.
 */
export function ScrollHintButton({
  label,
  target,
  tone = "dark",
  bottomClassName = "bottom-8",
  className = "",
}: {
  label: string;
  /** Ancla de destino (`#nosVideo`, `#somos`, ...). */
  target: string;
  tone?: "dark" | "light";
  /**
   * A que altura del pie se pega. **Va por esta prop y no por `className`**: el
   * `bottom` base y el del className compiten por la misma propiedad, y entre
   * dos utilidades de la misma especificidad decide el orden de la hoja
   * generada, no el orden en que se escriben — gana el del componente. Es la
   * misma trampa que ya documentan `CtaLink` y `CreamSection`.
   */
  bottomClassName?: string;
  className?: string;
}) {
  const color =
    tone === "dark"
      ? "text-[#05125a]/80 hover:text-[#05125a]"
      : "text-[#f9d78f]/85 hover:text-[#f9d78f]";

  return (
    <a
      href={target}
      className={`absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 transition-colors ${bottomClassName} ${color} ${className}`}
    >
      <span className="font-display text-[13px] font-normal uppercase tracking-[0.23em]">
        {label}
      </span>
      <ChevronDown size={18} className="animate-float" />
    </a>
  );
}
