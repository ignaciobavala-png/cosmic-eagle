/**
 * Indicador de scroll circular del mockup de Julia — `.scroll-ind` (círculo
 * solo) y `.scroll-ind-labeled` (círculo con una etiqueta debajo).
 *
 * Es distinto de `ScrollHintButton`, que porta `.hero-discover`: allá la
 * etiqueta va ARRIBA de una flecha suelta y animada; acá la flecha vive dentro
 * de un círculo de 34px y la etiqueta va DEBAJO. Los dos conviven en el mockup
 * y no son intercambiables.
 *
 * Los valores son los del CSS aprobado: círculo 34px con borde 1.5px, flecha
 * 14px, etiqueta 11px con 2px de tracking, separación 8px, anclado a 58px del
 * pie (56px cuando no lleva etiqueta), y en hover escala 1.2 con
 * `brightness(0.75)` — el oscurecido es intencional, no un error: el dorado
 * sobre fondo oscuro se apaga en vez de encenderse.
 */
export function ScrollIndicator({
  target,
  label,
  className = "",
}: {
  /** Ancla de destino, con `#`. */
  target: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={target}
      aria-label={label ?? "Seguir bajando"}
      className={`absolute left-1/2 z-[5] flex -translate-x-1/2 flex-col items-center gap-2 text-primary-container transition-[transform,filter] duration-[250ms] hover:scale-[1.2] hover:brightness-75 ${
        label ? "bottom-[58px]" : "bottom-14"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className="flex h-[34px] w-[34px] items-center justify-center rounded-full border-[1.5px] border-current text-sm leading-none"
      >
        ↓
      </span>
      {label && (
        <span className="text-[11px] uppercase tracking-[0.182em]">{label}</span>
      )}
    </a>
  );
}
