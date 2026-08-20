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
}: {
  title: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`text-center ${className}`}>
      <h2 className="font-display text-headline-md text-primary md:text-headline-lg">
        {title}
      </h2>

      {label && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <div
            aria-hidden="true"
            className="h-px w-12 bg-gradient-to-r from-transparent to-primary-fixed-dim/60 md:w-20"
          />
          <span className="text-label-sm uppercase text-primary-fixed-dim/85">
            {label}
          </span>
          <div
            aria-hidden="true"
            className="h-px w-12 bg-gradient-to-l from-transparent to-primary-fixed-dim/60 md:w-20"
          />
        </div>
      )}
    </div>
  );
}
