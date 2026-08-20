import { HOME_COPY, TESTIMONIALS } from "@/lib/constants";
import { Reveal } from "./ui/Reveal";
import { SectionHeading } from "./ui/SectionHeading";

/**
 * "Voces de Luz" — los testimonios de la home.
 *
 * Reescrita sobre el mockup del rediseno: encabezado P7 (`SectionHeading`) y
 * tarjetas de vidrio sobre la imagen de fondo. Antes eran tres cards con cinco
 * estrellas y un borde de color alternado, que no estan en el diseno nuevo.
 *
 * Las tarjetas son HTML y no un recorte del slide: tienen que crecer con el texto
 * (los tres testimonios miden distinto) y caer a una columna en mobile.
 *
 * El avatar es un CONTENEDOR, no una letra suelta: hoy muestra la inicial, y el
 * dia que haya fotos reales de los viajeros pasa a ser un `<Image>` adentro del
 * mismo box, sin tocar el layout. Mismo patron que el avatar del navbar.
 *
 * Dejo de ser client component: el scroll reveal lo aporta `Reveal`, que aisla el
 * `"use client"` en el wrapper.
 */
export function TestimonialsSection({ id }: { id?: string }) {
  return (
    <section
      id={id}
      className="relative w-full overflow-hidden"
    >
      {/* Sin imagen de fondo: `voces-de-luz.webp` y `cuatro-promesas.webp` son la
          misma composicion partida en dos slides, asi que apiladas repetian el
          reflejo dorado con una costura recta en el medio. El fondo lo pone el
          degrade del `body`, que ya trae el azul correcto. Tampoco lleva un halo
          propio: cualquier fondo que arranque en el borde superior de la seccion
          vuelve a dibujar la costura, que es justamente lo que se quiso sacar.

          Si alguna vez se vuelve a poner una imagen aca, ojo con el `z-index`: no
          puede ser negativo. `body` pinta su propio degrade despues de los
          descendientes de z negativo del contexto raiz (y `body::before`, el campo
          de estrellas, ya vive en `z-index: -1`), asi que un `-z-10` la deja
          tapada por el fondo de la pagina. */}
      <div className="mx-auto w-full max-w-narrative px-margin-mobile pt-24 pb-20 md:px-margin-desktop md:pt-[9rem] md:pb-section">
        <Reveal>
          <SectionHeading
            title={HOME_COPY.voces.title}
            label={HOME_COPY.voces.label}
          />

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="glass-card flex flex-col rounded-2xl p-7 text-left"
              >
                <blockquote className="font-display text-body-md leading-relaxed text-on-surface">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                {/* `mt-auto` alinea el pie de las tres tarjetas aunque las citas
                    tengan largos distintos. */}
                <figcaption className="mt-auto flex items-center gap-3 pt-8">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-variant/70 font-display text-primary-fixed-dim">
                    {t.initial}
                  </span>
                  <span>
                    <span className="block font-display text-body-md text-on-surface">
                      {t.name}
                    </span>
                    <span className="block text-label-sm uppercase text-on-surface-variant/70">
                      {t.location}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
