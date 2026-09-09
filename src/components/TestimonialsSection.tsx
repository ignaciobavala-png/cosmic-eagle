"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { HOME_COPY } from "@/lib/constants";
import type { Testimonial } from "@/lib/testimonials";
import { SectionHeading } from "./ui/SectionHeading";

/** Cada cuánto pasa al siguiente testimonio. */
const INTERVALO_MS = 3000;

/**
 * "Testimonios" — los testimonios de la home, sobre el fondo azul del diseño de
 * Julia (`.testimonios` del mockup + la corrección del 02/09).
 *
 * **Es UN solo contenedor centrado que va pasando los testimonios**, no el
 * carrusel arrastrable de nueve tarjetas que había antes (pedido de Sofía del
 * 07/09, junto con el cambio de título: era "Voces de Luz"). El carrusel obliga
 * a arrastrar para descubrir que hay más; acá se leen solos, de a uno, con el
 * texto en grande y centrado en la pantalla.
 *
 * Tres cosas que no hay que "simplificar":
 *
 * - **La caja es de alto fijo.** Los testimonios miden distinto y una caja que
 *   se adapta al texto haría saltar la sección entera en cada pase — con el
 *   bloque centrado en pantalla, el salto se ve en las dos direcciones.
 * - **El pase automático se frena con el puntero encima o el foco adentro**, y
 *   se reinicia con cada avance manual: si alguien está leyendo, el contenido no
 *   se le va solo. Mismo criterio que `PortalsSection`.
 * - **Con `prefers-reduced-motion` no rota solo ni funde**: quedan los puntos
 *   para pasar a mano. Un cambio de contenido cada 3s es movimiento aunque no
 *   haya transición.
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
  const reduced = useReducedMotion();
  const [activo, setActivo] = useState(0);
  const [pausado, setPausado] = useState(false);

  const total = testimonials.length;

  useEffect(() => {
    if (reduced || pausado || total < 2) return;
    const t = setTimeout(
      () => setActivo((i) => (i + 1) % total),
      INTERVALO_MS,
    );
    return () => clearTimeout(t);
    // `activo` en las dependencias es lo que reinicia la espera cuando alguien
    // pasa de testimonio a mano.
  }, [activo, pausado, reduced, total]);

  if (total === 0) return null;

  const t = testimonials[Math.min(activo, total - 1)];

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

        <div
          className="mx-auto mt-9 flex max-w-[760px] flex-col items-center"
          onPointerEnter={() => setPausado(true)}
          onPointerLeave={() => setPausado(false)}
          // El foco cae en los puntos, no en el contenedor: va la variante que
          // captura el foco de los hijos.
          onFocusCapture={() => setPausado(true)}
          onBlurCapture={() => setPausado(false)}
        >
          <div
            className="flex h-[300px] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/[0.08] px-7 py-8 sm:h-[260px] sm:px-12"
            aria-live="polite"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={t.id}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 1 } : { opacity: 0, y: -12 }}
                transition={{ duration: reduced ? 0 : 0.45 }}
                className="w-full"
              >
                <blockquote className="line-clamp-6 text-[15px] italic leading-relaxed text-primary sm:line-clamp-5 sm:text-[17px]">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-[12px] font-bold tracking-normal text-primary-container sm:text-[13px]">
                  {t.author_name}
                  {t.author_location && ` — ${t.author_location}`}
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          {total > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2.5">
              {testimonials.map((otro, i) => (
                <button
                  key={otro.id}
                  type="button"
                  onClick={() => setActivo(i)}
                  aria-label={`Ver el testimonio de ${otro.author_name}`}
                  aria-current={i === activo}
                  className={`h-2 w-2 rounded-full transition-[background-color,transform] duration-200 ${
                    i === activo
                      ? "scale-125 bg-primary-container"
                      : "bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
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
