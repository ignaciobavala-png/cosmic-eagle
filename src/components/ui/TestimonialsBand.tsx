import type { Testimonial } from "@/lib/testimonials";
import { Reveal } from "./Reveal";
import { TitleRule } from "./TitleRule";
import { TestimonialViewer } from "./TestimonialViewer";

/**
 * Banda de testimonios de ancho completo, del rediseño de /viajes: cada tipo de
 * experiencia cierra con las voces de quienes ya la hicieron.
 *
 * Se sale del ancho de su columna con `w-screen` + márgenes negativos, que es
 * lo mismo que hace el `.exp-testi` del mockup: vive dentro de la columna
 * angosta del bloque, pero se pinta de borde a borde.
 *
 * Los testimonios salen de la tabla `testimonials` (Julia confirmó el 27/08 que
 * las tres secciones llevan textos distintos). **Si la sección no tiene ninguno
 * cargado, la banda no se dibuja**: es preferible a un bloque vacío o a repetir
 * los de otra sección.
 *
 * El contenido lo pone `TestimonialViewer`, el mismo visor de la home: uno por
 * vez, sin caja y con las dos flechas finas (pedido de Sofía del 09/09). **Antes
 * era un carrusel horizontal de tarjetas con recuadro** — no alcanzaba con
 * sacarle el borde, porque era lo único que separaba un testimonio del
 * siguiente.
 *
 * **Funciona igual que la home**: sin pase automático y sin puntos, o sea que
 * el testimonio se mueve sólo si tocan una flecha (pedido de Sofía del 11/09
 * sobre "Nuestros Viajeros", aplicado también a "Nuestros Sanadores" — son la
 * misma banda en la misma página y que una pasara sola y la otra no se leería
 * como una falla). Es el default del visor, no hace falta pedirlo.
 */
export function TestimonialsBand({
  title,
  label,
  testimonials,
}: {
  title: string;
  /** Bajada bajo el título. Desde el 03/10 /viajes no la usa: la
   *  organización pidió que el título diga sólo "Testimonios". */
  label?: string;
  testimonials: Testimonial[];
}) {
  if (testimonials.length === 0) return null;

  return (
    <div className="relative left-1/2 mt-16 w-screen -translate-x-1/2 bg-[linear-gradient(180deg,#0079b3_0%,#05125a_90%)] px-margin-mobile py-16 text-center md:px-margin-desktop md:py-20">
      {/* Estandar de Experiencias: umbral 0.22 y reversible, como el resto de
          /viajes, que es la unica pagina donde vive esta banda. */}
      <Reveal amount={0.22} once={false} className="mx-auto max-w-5xl">
        {/* Título dorado, en `text-h2` y con filete del mismo oro, como el
            de la home (pedido de la organización, 08/10: "está un poco
            dejado"). Sobre azul el oro de texto es `primary-container`
            (regla del 28/08), y el filete va del color del título (06/10). */}
        <div className="mx-auto w-fit">
          <h3 className="font-display text-h2 text-primary-container">
            {title}
          </h3>
          <TitleRule tone="gold" align="center" className="mt-3" />
        </div>
        {label ? (
          <p className="mb-9 mt-2 text-label-sm uppercase text-primary-container">
            {label}
          </p>
        ) : (
          <div className="mb-9" />
        )}

        {/* Letra un poco mas grande que el default del visor (08/10). El
            alto acompaña: medido el 08/10, el testimonio mas largo ocupa 239px
            de los 256 utiles en mobile y 168 de 196 en escritorio. Si entra
            uno mas largo, `line-clamp` lo corta y queda el "Leer completo". */}
        <TestimonialViewer
          testimonials={testimonials}
          alturaClassName="h-[320px] sm:h-[260px]"
          quoteClassName="text-[17px] sm:text-[19px]"
          captionClassName="text-[14px] sm:text-[15px]"
        />
      </Reveal>
    </div>
  );
}
