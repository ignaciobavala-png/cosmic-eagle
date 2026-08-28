"use client";

import Link from "next/link";
import { motion, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { useSectionProgress } from "@/lib/use-section-progress";

type Cta = { label: string; href: string };

/**
 * El "scroll story" de la home: un tramo largo de scroll durante el cual el
 * texto se destila —los párrafos aparecen uno a uno, después se apagan y quedan
 * las palabras clave solas— y al final entra el botón.
 *
 * Es el efecto más caro del rediseño y es el segundo bloque de la página, así
 * que:
 *
 * - Todo se anima con `opacity` y `transform`, que resuelve el compositor. Nada
 *   de animar alturas ni tamaños de fuente.
 * - El texto está SIEMPRE en el HTML (sólo cambia su opacidad), así que la
 *   página se indexa y se lee con lector de pantalla aunque nunca se scrollee.
 * - Con `prefers-reduced-motion` el bloque se aplana: párrafos, palabras y
 *   botón visibles, sin tramo de scroll de más.
 *
 * Las palabras clave se resaltan dentro de los párrafos partiendo el texto por
 * la palabra: así el copy se escribe una sola vez y no hay que marcarlo a mano
 * con etiquetas.
 *
 * El progreso lo mide `useSectionProgress`, que documenta por qué no se usa
 * `useScroll` acá.
 */
export function ScrollStory({
  paragraphs,
  keywords,
  cta,
  id,
}: {
  paragraphs: readonly string[];
  keywords: readonly string[];
  cta: Cta;
  id?: string;
}) {
  const reduced = useReducedMotion();
  const { ref, progress: scrollYProgress } = useSectionProgress(!reduced);

  // Los párrafos ocupan el primer 55% del recorrido; entre 55% y 70% se apagan
  // y emergen las palabras; el resto es la pausa con el botón.
  const textOpacity = useTransform(scrollYProgress, [0.55, 0.68], [1, 0]);
  const wordsOpacity = useTransform(scrollYProgress, [0.6, 0.72], [0, 1]);
  const wordsScale = useTransform(scrollYProgress, [0.6, 0.85], [0.6, 1]);
  const ctaOpacity = useTransform(scrollYProgress, [0.78, 0.88], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.78, 0.88], [20, 0]);

  if (reduced) {
    return (
      <section
        id={id}
        className="w-full bg-[linear-gradient(to_bottom,#011360_0%,#020c41_100%)] px-margin-mobile py-24 md:px-margin-desktop"
      >
        <div className="mx-auto max-w-3xl space-y-6 text-body-lg text-primary">
          {paragraphs.map((p, i) => (
            <p key={i}>{highlight(p, keywords)}</p>
          ))}
          <div className="pt-6">
            <StoryCta {...cta} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id={id}
      ref={ref}
      className="relative h-[360vh] w-full bg-[linear-gradient(to_bottom,#011360_0%,#020c41_100%)]"
    >
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden px-margin-mobile md:px-margin-desktop">
        <motion.div
          style={{ opacity: textOpacity }}
          className="mx-auto max-w-3xl space-y-6"
        >
          {paragraphs.map((paragraph, i) => (
            <StoryParagraph key={i} progress={scrollYProgress} index={i} total={paragraphs.length}>
              {highlight(paragraph, keywords)}
            </StoryParagraph>
          ))}
        </motion.div>

        {/* Las palabras y el botón se apilan sobre el texto en la misma
            pantalla: el texto ya está en opacidad 0 cuando entran. */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: wordsOpacity }}
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center"
        >
          <motion.div style={{ scale: wordsScale }}>
            {keywords.map((word) => (
              <span
                key={word}
                className="block font-display text-[clamp(1.5rem,5vw,3.6rem)] font-semibold leading-tight text-primary-container"
              >
                {word}
              </span>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          style={{ opacity: ctaOpacity, y: ctaY }}
          className="absolute inset-x-0 bottom-16 text-center"
        >
          <StoryCta {...cta} />
        </motion.div>
      </div>
    </section>
  );
}

function StoryCta({ label, href }: Cta) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-primary-container bg-[linear-gradient(135deg,#f9d78f,#b3964b)] px-10 py-4 font-display text-label-sm font-bold uppercase text-[#05125a] transition-[filter] duration-300 hover:brightness-110"
    >
      {label}
      <span aria-hidden="true">↗</span>
    </Link>
  );
}

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
  const REVEAL_END = 0.5;
  const start = (REVEAL_END / total) * index;
  const end = (REVEAL_END / total) * (index + 1);
  const opacity = useTransform(progress, [start, end], [0, 1]);

  return (
    <motion.p
      style={{ opacity }}
      className="text-[clamp(0.95rem,1.9vw,1.375rem)] leading-relaxed text-primary"
    >
      {children}
    </motion.p>
  );
}

/** Parte el párrafo por las palabras clave y las pinta en dorado. */
function highlight(text: string, keywords: readonly string[]) {
  const pattern = new RegExp(`(${keywords.join("|")})`, "gi");

  return text.split(pattern).map((part, i) =>
    keywords.some((k) => k.toLowerCase() === part.toLowerCase()) ? (
      <span key={i} className="font-display font-semibold text-primary-container">
        {part}
      </span>
    ) : (
      part
    )
  );
}
