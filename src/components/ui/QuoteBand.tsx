"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Franja de frase manifiesto: una sola linea centrada sobre un ovalo de luz.
 *
 * La frase entra partida en dos: la primera mitad sube desde abajo y la segunda
 * baja desde arriba, las dos con fundido, hasta encontrarse en el centro (ver
 * docs/HOME_REDISENO.md §5.2).
 *
 * El corte de la frase es una decision de diseno, no automatica: por eso son dos
 * props y no un `split()` por indice, que partiria mal en cuanto cambie el texto.
 *
 * `mask` es el PNG con alfa que manda la disenadora — un ovalo de luz que va
 * ENCIMA del fondo de la pagina, no un fondo opaco. Por eso se sirve en WebP con
 * canal alfa y se apoya en `mix-blend-screen`: asi el degrade del `body` sigue
 * viendose a traves y no queda un rectangulo recortado.
 */
export function QuoteBand({
  left,
  right,
  mask,
  id,
}: {
  left: string;
  right: string;
  mask?: string;
  id?: string;
}) {
  const reduced = useReducedMotion();

  // Con "reducir movimiento" activo queda solo el fundido, sin desplazamiento.
  const enter = (from: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : from },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section
      id={id}
      className="relative flex min-h-[22rem] w-full items-center justify-center overflow-hidden py-24 md:min-h-[34rem] md:py-section"
    >
      {mask && (
        <Image
          src={mask}
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className="pointer-events-none select-none object-cover mix-blend-screen"
        />
      )}

      {/* `flex-wrap` + `justify-center`: en desktop las dos mitades quedan en una
          linea y en mobile caen a dos, sin cambiar la animacion de cada una. */}
      <p className="relative z-10 flex max-w-4xl flex-wrap items-baseline justify-center gap-x-2 px-margin-mobile text-center font-display text-headline-md text-primary text-shadow-glow md:px-margin-desktop md:text-headline-lg">
        <motion.span {...enter(28)}>{left}</motion.span>
        <motion.span {...enter(-28)}>{right}</motion.span>
      </p>
    </section>
  );
}
