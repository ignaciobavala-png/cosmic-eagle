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
      className="relative flex w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#0079b3_0%,#05125a_45%)]"
    >
      <div className="mx-auto w-full max-w-narrative px-margin-mobile pt-24 pb-10 text-center md:px-margin-desktop md:pt-[7.5rem]">
        <SectionHeading
          title={HOME_COPY.voces.title}
          label={HOME_COPY.voces.label}
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
          className="mt-12 flex cursor-grab gap-5 overflow-x-auto px-2.5 pb-3.5 select-none active:cursor-grabbing [mask-image:linear-gradient(to_right,#000_92%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,#000_92%,transparent_100%)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {testimonials.map((t) => (
            <figure
              key={t.id}
              className="flex min-h-[14rem] w-[18.75rem] shrink-0 flex-col justify-center rounded-xl border border-white/20 bg-white/[0.08] p-8 text-left"
            >
              <blockquote className="text-body-md italic leading-relaxed text-primary">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-label-sm font-bold text-primary-container">
                {t.author_name}
                {t.author_location && ` — ${t.author_location}`}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      {/* La franja del pie: la imagen entra desvanecida desde arriba
          (`.testi-bottom-img` del mockup) para que se integre con el azul en vez
          de cortar contra él. El alto va por `aspect-ratio` y con un piso, para
          que en una pantalla ancha no quede una tira de dos centímetros. */}
      <div className="relative aspect-[16/6] min-h-[13rem] w-full [mask-image:linear-gradient(to_bottom,transparent_0%,#000_18%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,#000_18%)]">
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
