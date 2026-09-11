"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { Testimonial } from "@/lib/testimonials";

/** Cada cuánto pasa al siguiente testimonio, donde el pase automático está. */
const INTERVALO_MS = 3000;

/**
 * El visor de testimonios del sitio: **uno por vez, centrado y SIN caja**, con
 * dos flechas finas para pasar a mano y los puntos abajo.
 *
 * Lo comparten los tres juegos —"Testimonios" de la home, "Nuestros Sanadores" y
 * "Nuestros Viajeros" de Experiencias— desde el pedido de Sofía del 09/09: el
 * recuadro sumaba un rectángulo más a una composición que ya tiene de sobra.
 *
 * En Experiencias esto **reemplaza al carrusel horizontal de tarjetas**. No
 * alcanzaba con sacarle el borde: ahí la caja era lo único que separaba un
 * testimonio del siguiente, y sin ella los textos quedaban pegados sin saber
 * dónde termina cada uno. Pasando de a uno el problema no existe.
 *
 * Cuatro cosas que no hay que "simplificar":
 *
 * - **El bloque tiene alto fijo aunque no haya caja.** Los testimonios miden
 *   distinto y un alto que sigue al texto haría saltar todo lo que tiene debajo
 *   en cada pase.
 * - **El pase automático se frena con el puntero encima o el foco adentro**, y
 *   se reinicia con cada avance manual: si alguien está leyendo, el contenido no
 *   se le va solo. Mismo criterio que `PortalsSection`. En la home ese pase está
 *   apagado del todo (`auto={false}`, pedido de Sofía del 11/09): ahí el
 *   testimonio se mueve sólo si tocan una flecha. Las dos bandas de Experiencias
 *   siguen pasando solas — si se quiere lo mismo, es pasarles la prop.
 * - **Con `prefers-reduced-motion` no rota solo ni funde**: quedan las flechas y
 *   los puntos. Un cambio de contenido cada 3s es movimiento aunque no haya
 *   transición.
 * - **Las flechas van FUERA del texto, no encima**, así no tapan nada ni
 *   necesitan un fondo propio para despegarse del testimonio.
 */
export function TestimonialViewer({
  testimonials,
  className = "",
  /** Alto del bloque de texto. Se fija para que la sección no salte al pasar. */
  alturaClassName = "h-[300px] sm:h-[260px]",
  quoteClassName = "text-[15px] sm:text-[17px]",
  auto = true,
  dots = true,
}: {
  testimonials: Testimonial[];
  className?: string;
  alturaClassName?: string;
  quoteClassName?: string;
  /** Pase automático cada 3s. Apagado, sólo avanzan las flechas. */
  auto?: boolean;
  /** Los puntos de abajo. Sin ellos, las flechas son el único control. */
  dots?: boolean;
}) {
  const reduced = useReducedMotion();
  const [activo, setActivo] = useState(0);
  const [pausado, setPausado] = useState(false);

  const total = testimonials.length;

  useEffect(() => {
    if (!auto || reduced || pausado || total < 2) return;
    const t = setTimeout(() => setActivo((i) => (i + 1) % total), INTERVALO_MS);
    return () => clearTimeout(t);
    // `activo` en las dependencias es lo que reinicia la espera cuando alguien
    // pasa de testimonio a mano.
  }, [activo, auto, pausado, reduced, total]);

  if (total === 0) return null;

  const t = testimonials[Math.min(activo, total - 1)];

  return (
    <div
      className={`mx-auto flex max-w-[760px] flex-col items-center ${className}`}
      onPointerEnter={() => setPausado(true)}
      onPointerLeave={() => setPausado(false)}
      // El foco cae en las flechas y los puntos, no en el contenedor: va la
      // variante que captura el foco de los hijos.
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
    >
      <div className="flex w-full items-center gap-1 sm:gap-4">
        {total > 1 && (
          <Flecha
            hacia="anterior"
            onClick={() => setActivo((i) => (i - 1 + total) % total)}
          />
        )}

        <div
          className={`flex min-w-0 flex-1 items-center justify-center overflow-hidden px-1 py-8 sm:px-6 ${alturaClassName}`}
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
              <blockquote
                className={`line-clamp-6 italic leading-relaxed text-primary sm:line-clamp-5 ${quoteClassName}`}
              >
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
          <Flecha
            hacia="siguiente"
            onClick={() => setActivo((i) => (i + 1) % total)}
          />
        )}
      </div>

      {dots && total > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {testimonials.map((otro, i) => (
            <button
              key={otro.id}
              type="button"
              onClick={() => setActivo(i)}
              aria-label={`Ver el testimonio de ${otro.author_name}`}
              aria-current={i === activo}
              className={`h-1.5 w-1.5 rounded-full transition-[background-color,transform] duration-200 ${
                i === activo
                  ? "scale-125 bg-primary-container"
                  : "bg-white/25 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Las dos flechas para pasar a mano. Trazo de 1px y dorado apagado: son un
 * gesto, no un control de reproductor.
 *
 * El área que se puede tocar es de 44px aunque el dibujo mida 20 — el mínimo
 * cómodo con el dedo —, y con `p-3` se consigue sin engordar la línea.
 * `shrink-0` porque el testimonio de al lado es `flex-1`: sin eso, un texto
 * largo le come el ancho a la flecha y la deforma.
 */
function Flecha({
  hacia,
  onClick,
}: {
  hacia: "anterior" | "siguiente";
  onClick: () => void;
}) {
  const Icono = hacia === "anterior" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        hacia === "anterior" ? "Testimonio anterior" : "Testimonio siguiente"
      }
      className="shrink-0 p-3 text-primary-container/45 transition-colors duration-300 hover:text-primary-container focus-visible:text-primary-container"
    >
      <Icono className="h-5 w-5" strokeWidth={1} aria-hidden="true" />
    </button>
  );
}
