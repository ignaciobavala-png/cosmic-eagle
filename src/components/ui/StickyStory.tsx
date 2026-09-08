"use client";

import { motion, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { useSectionProgress } from "@/lib/use-section-progress";
import { ScrollHintButton } from "./ScrollHintButton";

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
  scrollHint,
}: {
  paragraphs: readonly React.ReactNode[];
  id?: string;
  /** Indicador de scroll al pie del panel sticky ("CONTINUAR" en /nosotros). */
  scrollHint?: { label: string; target: string };
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
      <div className="sticky top-0 relative flex h-[100svh] items-center justify-center overflow-hidden px-margin-mobile md:px-margin-desktop">
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
        {scrollHint && (
          <ScrollHintButton
            label={scrollHint.label}
            target={scrollHint.target}
            tone="light"
          />
        )}
      </div>
    </section>
  );
}

/**
 * Cada párrafo tiene su propio tramo dentro del 75% inicial del recorrido.
 *
 * El PRIMERO arranca visible (su tramo termina en 0), así que los que se revelan
 * con el scroll son `total - 1`. Es lo que evita que la sección se estrene en
 * blanco: mide 260vh y el desplegable de "Nosotros" ancla justo a su arranque,
 * o sea con el progreso en 0 — con el primer párrafo también apagado, llegar
 * acá desde el navbar dejaba una pantalla azul vacía hasta scrollear.
 */
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
  const pasos = Math.max(total - 1, 1);
  // El tramo del primero termina en 0: `useTransform` recorta fuera del rango,
  // así que queda en opacidad 1 desde el arranque de la sección.
  const start = (REVEAL_END / pasos) * (index - 1);
  const end = (REVEAL_END / pasos) * index;

  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [30, 0]);

  return (
    <motion.p style={{ opacity, y }}>{children}</motion.p>
  );
}
