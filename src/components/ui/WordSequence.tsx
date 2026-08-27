"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Secuencia de palabras encadenadas con flechas (`Liberar → Recordar →
 * Reconectar → Encarnar`), del rediseño de /nosotros.
 *
 * Las palabras entran alternando de abajo y de arriba, escalonadas. Julia lo
 * resolvió con `transition-delay` por `nth-child`; acá es el `staggerChildren`
 * de Framer Motion, que ya usa el resto del sitio y no obliga a escribir un
 * retardo por posición.
 *
 * En mobile la fila pasa a columna y la flecha rota 90°, igual que en el mockup.
 *
 * `once: true`: la secuencia se lee una vez. Al volver a subir no se re-arma
 * sola, que era el comportamiento de ella y marea en una pantalla completa.
 */
export function WordSequence({ words }: { words: readonly string[] }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ staggerChildren: reduced ? 0 : 0.22 }}
      className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-4"
    >
      {words.map((word, i) => (
        <motion.div
          key={word}
          className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5"
        >
          {i > 0 && (
            <motion.span
              aria-hidden="true"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { duration: 0.9 } },
              }}
              className="rotate-90 text-2xl text-[#b3964b] sm:rotate-0"
            >
              →
            </motion.span>
          )}
          <motion.span
            variants={{
              hidden: { opacity: 0, y: i % 2 === 0 ? 36 : -36 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.9 } },
            }}
            className="font-display text-[clamp(1.5rem,4.2vw,2.875rem)] font-bold text-[#05125a]"
          >
            {word}
          </motion.span>
        </motion.div>
      ))}
    </motion.div>
  );
}
