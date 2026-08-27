import { TripCard, type TripCardData } from "./TripCard";

/**
 * "Cartelera": el panel dorado con el calendario de un tipo de experiencia, que
 * se despliega desde el botón de cada bloque en /viajes.
 *
 * El dorado es el mismo degradé del mockup, y sus extremos (`#f9d78f`,
 * `#b3964b`) son el token `primary-container` y la base del `glass-card` — la
 * diseñadora trabaja dentro de la paleta, así que va en CSS y no como imagen.
 *
 * Las tarjetas van en `tone="light"`: sobre el dorado, la tarjeta de vidrio
 * oscuro del resto del sitio desaparece.
 *
 * La fila scrollea en horizontal en vez de animarse sola en loop como en el
 * HTML de Julia. Un carrusel en movimiento continuo no se puede leer ni tocar
 * en mobile, y acá cada tarjeta es un link a la inscripción: la fila es
 * arrastrable y el desvanecido de los bordes avisa que sigue.
 */
export function TripCarousel({
  caption,
  title,
  trips,
  emptyLabel,
}: {
  caption: string;
  title: string;
  trips: TripCardData[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-[20px] bg-[linear-gradient(135deg,#7a6329_0%,#f9d78f_30%,#fbe9c0_50%,#b3964b_75%,#6b551f_100%)] px-5 py-11">
      <p className="text-center text-label-sm uppercase text-[#05125a]/70">
        {caption}
      </p>
      <h3 className="mb-8 mt-2 text-center font-display text-headline-md text-[#05125a]">
        {title}
      </h3>

      {trips.length === 0 ? (
        <p className="pb-2 text-center text-body-md text-[#05125a]/80">
          {emptyLabel}
        </p>
      ) : (
        // `-mx-5 px-5` para que la primera y la ultima tarjeta no queden pegadas
        // al borde del panel cuando la fila esta scrolleada a un extremo.
        <div className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="w-[17rem] shrink-0 snap-start sm:w-[19rem]"
            >
              <TripCard trip={trip} tone="light" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
