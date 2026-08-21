import Image from "next/image";
import { HOME_COPY, IMAGES, TESTIMONIALS } from "@/lib/constants";
import { Reveal } from "./ui/Reveal";
import { SectionHeading } from "./ui/SectionHeading";

/**
 * "Voces de Luz" — los testimonios de la home.
 *
 * Reescrita sobre el mockup del rediseno: encabezado P7 (`SectionHeading`) y
 * tarjetas de vidrio sobre el slide de fondo. Antes eran tres cards con cinco
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
      {/* El fondo es `voces-de-luz.webp`, el slide de Julia para esta seccion.

          El slide trae el polvo dorado en su borde SUPERIOR, y ese dorado es el
          mismo plano que "Cuatro promesas" ya dibuja en su pie: apilados tal
          cual, el reflejo salia dos veces con una costura recta en el medio. Por
          eso el envoltorio arranca un 30% MAS ARRIBA que la seccion (`-top-[30%]`
          contra `bottom-0`) y el `overflow-hidden` de la seccion se come esa
          franja: queda el campo azul, que es lo que levanta el bloque del negro
          del pie de la pagina, sin repetir el dorado.

          La mascara entra desvanecida (asi engancha con el desvanecido del pie de
          las promesas, en vez de arrancar con un filo). Ojo con los porcentajes:
          se miden sobre el ENVOLTORIO, que es un 30% mas alto que la seccion, asi
          que el borde de arriba de la seccion cae recien en el 23% de la mascara
          — arrancar el degrade en 0% dejaba la imagen ya medio opaca justo en ese
          borde, que es la costura que se queria evitar.

          ABAJO NO se desvanece (`#000 100%`): sale con filo recto contra el borde
          de la seccion. Antes salia en `transparent`, y como `ClosingBanner`
          ademas ENTRA desvanecido, entre los dos quedaba una franja sin imagen
          donde asomaba el degrade del `body` — que a esta altura del documento ya
          va por `#060b1a`, o sea negro. El filo no se ve porque el banner sube con
          `-mt` y lo tapa justo donde ya es opaco: los dos se cruzan.

          Ojo con el `z-index`: no puede ser negativo. `body` pinta su propio
          degrade despues de los descendientes de z negativo del contexto raiz (y
          `body::before`, el campo de estrellas, ya vive en `z-index: -1`), asi
          que un `-z-10` deja la imagen tapada por el fondo de la pagina. Va
          envoltorio en `z-0` y contenido en `z-10`. */}
      <div className="absolute inset-x-0 -top-[30%] bottom-0 z-0 [mask-image:linear-gradient(to_bottom,transparent_0%,transparent_23%,rgba(0,0,0,0.5)_33%,#000_45%,#000_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,transparent_23%,rgba(0,0,0,0.5)_33%,#000_45%,#000_100%)]">
        <Image
          src={IMAGES.homeVoces}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-bottom"
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-narrative px-margin-mobile pt-24 pb-20 md:px-margin-desktop md:pt-[9rem] md:pb-section">
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
