"use client";

import { motion, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { useSectionProgress } from "@/lib/use-section-progress";

/**
 * Bloque de texto que queda fijo en pantalla mientras el scroll revela un
 * párrafo por vez, y se libera recién cuando terminó la secuencia.
 *
 * Es el `.nos-about` del rediseño. La animación está atada al PROGRESO del
 * scroll y no disparada por un observer: al volver hacia arriba los párrafos se
 * apagan en orden inverso, que es lo que hace el original.
 *
 * El alto del contenedor es lo que dura el efecto (cuanto más alto, más lento);
 * el hijo `sticky` es lo que se ve. La revelación termina en el 75% del
 * recorrido y el 25% final queda de pausa con el texto completo, para que no se
 * lea a las corridas justo cuando se suelta.
 *
 * Con `prefers-reduced-motion` los párrafos quedan visibles y el bloque deja de
 * ocupar tres pantallas de scroll: se muestra como texto normal.
 *
 * El progreso lo mide `useSectionProgress`, que documenta por qué no se usa
 * `useScroll` acá.
 */
export function StickyStory({
  paragraphs,
  id,
}: {
  paragraphs: readonly React.ReactNode[];
  id?: string;
}) {
  const reduced = useReducedMotion();
  const { ref, progress: scrollYProgress } = useSectionProgress(!reduced);

  if (reduced) {
    return (
      <section
        id={id}
        className="w-full bg-[linear-gradient(180deg,#05125a_0%,#0079b3_100%)] px-margin-mobile py-24 md:px-margin-desktop"
      >
        <div className="mx-auto max-w-3xl space-y-6 text-body-md text-primary md:text-body-lg">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      id={id}
      ref={ref}
      className="relative w-full bg-[linear-gradient(180deg,#05125a_0%,#0079b3_100%)] h-[260vh] md:h-[280vh]"
    >
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden px-margin-mobile md:px-margin-desktop">
        <div className="max-w-3xl space-y-6 text-body-md text-primary md:text-body-lg">
          {paragraphs.map((paragraph, i) => (
            <StoryParagraph
              key={i}
              progress={scrollYProgress}
              index={i}
              total={paragraphs.length}
            >
              {paragraph}
            </StoryParagraph>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Cada párrafo tiene su propio tramo dentro del 75% inicial del recorrido. */
function StoryParagraph({
  children,
  progress,
  index,
  total,
}: {
  children: React.ReactNode;
  progress: MotionValue<number>;
  index: number;
  total: number;
}) {
  const REVEAL_END = 0.75;
  const start = (REVEAL_END / total) * index;
  const end = (REVEAL_END / total) * (index + 1);

  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [30, 0]);

  return (
    <motion.p style={{ opacity, y }}>{children}</motion.p>
  );
}
