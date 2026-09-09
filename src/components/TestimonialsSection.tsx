import Image from "next/image";
import { HOME_COPY } from "@/lib/constants";
import type { Testimonial } from "@/lib/testimonials";
import { SectionHeading } from "./ui/SectionHeading";
import { TestimonialViewer } from "./ui/TestimonialViewer";

/**
 * "Testimonios" — los testimonios de la home, sobre el fondo azul del diseño de
 * Julia (`.testimonios` del mockup + la corrección del 02/09).
 *
 * **Es UN solo testimonio centrado que va pasando**, no el carrusel arrastrable
 * de nueve tarjetas que había antes (pedido de Sofía del 07/09, junto con el
 * cambio de título: era "Voces de Luz"). El carrusel obliga a arrastrar para
 * descubrir que hay más; acá se leen solos, de a uno, con el texto en grande y
 * centrado en la pantalla.
 *
 * El visor es `TestimonialViewer`, compartido con las dos bandas de
 * Experiencias: ahí están las reglas del pase, las flechas y por qué no lleva
 * caja. Esta sección sólo pone el marco — el fondo, la cabecera y la franja de
 * imagen del pie.
 *
 * Ya no necesita `"use client"`: todo lo que tenía estado se fue al visor, y
 * esto volvió a ser un Server Component.
 *
 * La franja de imagen del pie es editable (slot `home.voces.image`) — la key NO
 * se renombra aunque la sección haya cambiado de nombre, o lo que la clienta ya
 * subió queda huérfano.
 */
export function TestimonialsSection({
  id,
  testimonials,
  image,
}: {
  id?: string;
  testimonials: Testimonial[];
  /** La franja de imagen del pie (slot `home.voces.image`). */
  image: string;
}) {
  if (testimonials.length === 0) return null;

  return (
    <section
      id={id}
      // `min-h` y no `h`: con alto fijo, una pantalla baja no achicaba nada
      // —la cabecera es `shrink-0` y la franja tiene `min-h`— sino que se
      // comía 127px por abajo, y lo que se perdía era la franja de imagen
      // entera (medido a 1346x578 y 1280x600). Con `min-h` la sección crece
      // sólo en esos casos; a 900 y a 844 sigue midiendo exactamente una
      // pantalla, que es como se verificó el 03/09.
      className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#0079b3_0%,#05125a_45%)]"
    >
      {/* El `pt` de mobile suma la altura del navbar: la sección mide una
          pantalla justa y la banda opaca le tapaba el título. En escritorio los
          120px del mockup ya alcanzan.

          La cabecera no se estira ni se encoge: el alto sobrante es para la
          franja de imagen del pie. `min-h-0` deja que el bloque se comprima si
          la pantalla es baja, en vez de empujar la imagen fuera de la vista —
          era lo que la hacía desaparecer en mobile. */}
      <div className="mx-auto w-full min-h-0 max-w-narrative shrink-0 px-margin-mobile pt-[calc(3rem+var(--navbar-h))] pb-6 text-center md:px-margin-desktop md:pt-[7.5rem] md:pb-5">
        <SectionHeading
          title={HOME_COPY.voces.title}
          label={HOME_COPY.voces.label}
          titleClassName="text-[32px] font-bold md:text-[42px]"
          labelClassName="text-[13px] tracking-[0.115em] text-[#f9d78f]"
          lineClassName="max-w-[180px]"
        />

        <TestimonialViewer testimonials={testimonials} className="mt-9" />
      </div>

      {/* La franja del pie ocupa TODO el alto que sobra y termina con la
          pantalla (`flex-1` del mockup, no un `aspect-ratio`): con una relación
          de aspecto fija se pasaba de la pantalla en escritorio y se comía a sí
          misma en mobile. La imagen entra desvanecida desde arriba para
          integrarse con el azul en vez de cortar contra él. */}
      <div className="relative min-h-[9rem] flex-1 [mask-image:linear-gradient(to_bottom,transparent_0%,#000_18%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,#000_18%)]">
        {/* `object-bottom`: el asset del repo lleva el polvo dorado arriba y el
            campo azul abajo, y es el azul el que tiene que quedar a la vista
            bajo la mascara. */}
        <Image
          src={image}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-bottom"
        />
      </div>
    </section>
  );
}
