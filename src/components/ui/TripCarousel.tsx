import { ExperienceGate } from "./ExperienceGate";
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
 * El calendario se mueve solo en escritorio (`.carousel-inner-scroll` del
 * mockup) y se frena al pasar el mouse, que es como pide la correccion del
 * 02/09. En mobile no: ahi la fila se arrastra con el dedo, y una animacion en
 * curso pelea con el scroll tactil.
 *
 * Los bordes se desvanecen contra el dorado con una `mask-image` horizontal
 * (transparente en el 8% de cada punta): es el efecto de fundido que pide el
 * diseno, y sale gratis porque el panel de atras ya es el degrade.
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
        // La pista lleva las tarjetas dos veces en escritorio para que el
        // loop cierre en `-50%`; el segundo juego es `aria-hidden` y sin foco,
        // porque son los mismos links repetidos.
        //
        // `-mx-5 px-5` para que la primera y la ultima tarjeta no queden
        // pegadas al borde del panel cuando la fila esta arrastrada al extremo.
        <ExperienceGate>
        <div className="marquee-track -mx-5 overflow-x-auto px-5 pb-3 [mask-image:linear-gradient(to_right,transparent_0%,#000_8%,#000_92%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,#000_8%,#000_92%,transparent_100%)] [scrollbar-width:none] md:overflow-hidden [&::-webkit-scrollbar]:hidden">
          {/* El separador va como `mr` de cada tarjeta y NO como `gap` de la
              pista: con `gap`, el recorrido de `-50%` cae medio separador
              corrido del arranque del segundo juego y el loop pega un saltito
              en cada vuelta. Con el margen adentro de cada item el ancho es
              exactamente `2n * (tarjeta + separador)` y `-50%` cierra justo. */}
          <div className="animate-marquee flex w-max">
            {trips.map((trip) => (
              <div key={trip.id} className="mr-5 w-[17rem] shrink-0 sm:w-[20rem]">
                <TripCard trip={trip} tone="light" />
              </div>
            ))}
            {trips.map((trip) => (
              <div
                key={`copia-${trip.id}`}
                aria-hidden="true"
                tabIndex={-1}
                className="mr-5 hidden w-[17rem] shrink-0 sm:w-[20rem] md:block"
              >
                <TripCard trip={trip} tone="light" />
              </div>
            ))}
          </div>
        </div>
        </ExperienceGate>
      )}
    </div>
  );
}
