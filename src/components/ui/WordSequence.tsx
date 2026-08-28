"use client";

import { Reveal, RevealItem } from "./Reveal";

/**
 * Secuencia de palabras encadenadas con flechas (`Liberar → Recordar →
 * Reconectar → Encarnar`), del rediseño de /nosotros.
 *
 * Las palabras entran alternando de abajo y de arriba (±36px), escalonadas. Los
 * siete elementos —cuatro palabras y tres flechas— llevan retardos de 0.1s a
 * 1.2s, que es lo que Julia escribe a mano por `nth-child`: de ahí salen el
 * `delay` de 0.1 y el escalón de 0.183 del contenedor.
 *
 * Por eso van los siete como hijos DIRECTOS del contenedor y no agrupados de a
 * pares: el escalón de Framer Motion se reparte entre los hijos directos, y
 * anidarlos daría dos tiempos en vez de siete.
 *
 * En mobile la fila pasa a columna y la flecha rota 90°, igual que en el mockup.
 *
 * `once={false}`: la secuencia se re-arma al volver hacia arriba, que es el
 * estándar reversible de /nosotros y /viajes.
 */
export function WordSequence({ words }: { words: readonly string[] }) {
  return (
    <Reveal
      amount={0.4}
      once={false}
      stagger={0.183}
      delay={0.1}
      className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-4"
    >
      {words.flatMap((word, i) => [
        ...(i > 0
          ? [
              <RevealItem
                key={`arrow-${word}`}
                as="span"
                y={0}
                className="rotate-90 text-2xl text-on-primary-container sm:rotate-0"
              >
                <span aria-hidden="true">→</span>
              </RevealItem>,
            ]
          : []),
        <RevealItem
          key={word}
          as="span"
          y={i % 2 === 0 ? 36 : -36}
          className="font-display text-[clamp(1.5rem,4.2vw,2.875rem)] font-bold text-[#05125a]"
        >
          {word}
        </RevealItem>,
      ])}
    </Reveal>
  );
}
