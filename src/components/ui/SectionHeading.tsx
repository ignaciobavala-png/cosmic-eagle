/**
 * P7 — Encabezado de seccion: titulo serif centrado y, debajo, una etiqueta en
 * mayusculas flanqueada por dos filetes que se desvanecen hacia afuera.
 *
 * Es la primitiva que habia quedado pendiente de la entrega original de la
 * disenadora (docs/RECORRIDO.md §4) y que el rediseno de la home vuelve a pedir
 * para "Voces de Luz".
 *
 * Los filetes son decoracion: van en `div` vacios y no en pseudo-elementos con
 * `content` para que ningun lector de pantalla los anuncie.
 */
export function SectionHeading({
  title,
  label,
  className = "",
  titleClassName = "text-headline-md md:text-headline-lg",
  labelClassName = "text-label-sm text-primary-fixed-dim/85",
  lineClassName = "max-w-[120px]",
}: {
  title: string;
  label?: string;
  className?: string;
  /** El mockup fija el px por seccion ("Voces de Luz" va en 42). */
  titleClassName?: string;
  labelClassName?: string;
  /** El largo de los dos filetes. Crecen hasta este tope. */
  lineClassName?: string;
}) {
  return (
    <div className={`text-center ${className}`}>
      <h2 className={`font-display text-primary ${titleClassName}`}>
        {title}
      </h2>

      {label && (
        <div className="mt-[14px] flex items-center justify-center gap-5">
          <div
            aria-hidden="true"
            className={`h-px w-12 flex-1 bg-gradient-to-r from-transparent to-primary-fixed-dim/60 md:w-20 ${lineClassName}`}
          />
          <span className={`uppercase ${labelClassName}`}>
            {label}
          </span>
          <div
            aria-hidden="true"
            className={`h-px w-12 flex-1 bg-gradient-to-l from-transparent to-primary-fixed-dim/60 md:w-20 ${lineClassName}`}
          />
        </div>
      )}
    </div>
  );
}
