import type { Testimonial } from "@/lib/testimonials";
import { Reveal } from "./Reveal";

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
 */
export function TestimonialsBand({
  title,
  label,
  testimonials,
}: {
  title: string;
  label: string;
  testimonials: Testimonial[];
}) {
  if (testimonials.length === 0) return null;

  return (
    <div className="relative left-1/2 mt-16 w-screen -translate-x-1/2 bg-[linear-gradient(180deg,#0079b3_0%,#05125a_90%)] px-margin-mobile py-16 text-center md:px-margin-desktop md:py-20">
      {/* Estandar de Experiencias: umbral 0.22 y reversible, como el resto de
          /viajes, que es la unica pagina donde vive esta banda. */}
      <Reveal amount={0.22} once={false} className="mx-auto max-w-5xl">
        <h3 className="font-display text-headline-md text-primary">{title}</h3>
        <p className="mb-9 mt-2 text-label-sm uppercase text-primary-container">
          {label}
        </p>

        <div className="flex snap-x gap-5 overflow-x-auto pb-3 text-left [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {testimonials.map((t) => (
            <figure
              key={t.id}
              className="flex w-[18rem] shrink-0 snap-start flex-col justify-center rounded-xl border border-white/20 bg-white/[0.08] p-8"
            >
              <blockquote className="text-body-md italic text-primary">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-label-sm font-bold text-primary-container">
                {t.author_name}
                {t.author_location ? ` — ${t.author_location}` : ""}
              </figcaption>
            </figure>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
