"use client";

import Image from "next/image";
import { useRef } from "react";
import { HOME_COPY } from "@/lib/constants";
import type { Testimonial } from "@/lib/testimonials";
import { SectionHeading } from "./ui/SectionHeading";

/**
 * "Voces de Luz" — los testimonios de la home, reescritos sobre el diseño de
 * Julia (`.testimonios` del mockup + la corrección del 02/09, que marcaba que
 * esta sección era la única que no se había respetado).
 *
 * Tres cosas que la separan de la versión anterior, que era una grilla de tres
 * tarjetas de vidrio:
 *
 * - **Es un carrusel horizontal arrastrable**, no una grilla. El diseño prevé
 *   nueve testimonios y una grilla de nueve tarjetas ocuparía tres pantallas.
 * - **El fondo es el degradé azul** (`#0079b3` → `#05125a` al 45%) y no una
 *   foto: la foto pasó a ser una franja al pie que se funde con ese azul.
 * - **La franja del pie es editable** (`home.voces.image`), como el resto de las
 *   imágenes de la home.
 *
 * El arrastre con el mouse es explícito porque un `overflow-x` sólo se arrastra
 * con el dedo: en escritorio hay que empujar la barra o usar shift+rueda, y el
 * diseño pide poder tomar las tarjetas. En touch no se toca nada — lo maneja el
 * scroll nativo, que es mejor que cualquier emulación.
 *
 * **No tiene animación de entrada, a propósito**: en el código aprobado de Julia
 * este bloque es el único sin IntersectionObserver.
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
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);

  if (testimonials.length === 0) return null;

  function onPointerDown(e: React.PointerEvent) {
    // Sólo mouse: en touch el scroll nativo ya arrastra, y secuestrarlo rompe
    // el desplazamiento con inercia.
    if (e.pointerType !== "mouse" || !track.current) return;
    drag.current = { x: e.clientX, left: track.current.scrollLeft };
    track.current.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !track.current) return;
    track.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
  }

  function endDrag(e: React.PointerEvent) {
    if (!drag.current || !track.current) return;
    drag.current = null;
    track.current.releasePointerCapture(e.pointerId);
  }

  return (
    <section
      id={id}
      className="relative flex h-[100svh] w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#0079b3_0%,#05125a_45%)]"
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

        {/* La máscara del borde derecho avisa que la fila sigue. La izquierda
            queda a filo: el carrusel arranca ahí y un desvanecido en el
            arranque se lee como un error de recorte. */}
        <div
          ref={track}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="mx-auto mt-9 flex max-w-[1000px] cursor-grab gap-5 overflow-x-auto px-2.5 pb-3.5 select-none active:cursor-grabbing [mask-image:linear-gradient(to_right,#000_92%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,#000_92%,transparent_100%)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {testimonials.map((t) => (
            /* La tarjeta es RECTANGULAR y de alto fijo (300×225 del mockup):
               más ancha que alta. El alto no puede depender del texto — con
               nueve testimonios de largo distinto la fila quedaba dispareja y
               la sección se pasaba de una pantalla. El panel limita el
               testimonio a 250 caracteres justamente para que entre; el
               `line-clamp` es la red por si alguno viejo es más largo.

               La tarjeta es más ancha que los 300px del mockup (que se dibujó
               con placeholders de una línea): con 250 caracteres reales, 300px
               de ancho no alcanzan para las seis líneas que entran en 225px de
               alto. Más ancha entra el texto y queda más rectangular, que es
               justo lo que pide la corrección. */
            <figure
              key={t.id}
              className="flex h-[225px] w-[320px] shrink-0 flex-col justify-center overflow-hidden rounded-xl border border-white/20 bg-white/[0.08] p-7 text-left sm:w-[360px]"
            >
              <blockquote className="line-clamp-6 text-[13px] sm:text-[14px] italic leading-relaxed text-primary">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-3 shrink-0 text-[12px] font-bold tracking-normal text-primary-container">
                {t.author_name}
                {t.author_location && ` — ${t.author_location}`}
              </figcaption>
            </figure>
          ))}
        </div>
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
