"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { useSectionProgress } from "@/lib/use-section-progress";

type Cta = { label: string; href: string };

/**
 * El "scroll story" de la home: un tramo largo de scroll durante el cual el
 * texto se destila —los párrafos aparecen uno a uno, después el texto blanco se
 * apaga por tramos y quedan encendidas sólo las palabras clave, que viajan
 * desde su lugar en el párrafo hasta el centro y se agrandan— y al final entra
 * el botón.
 *
 * Las cuatro fases, los umbrales y los offsets de salida de cada palabra salen
 * literales del mockup aprobado de Julia (`homepage_correccion.html`, motor
 * "SCROLL STORY"; ver `docs/entregas/2026-09-02-julia/`). No son valores
 * elegidos acá: si hay que moverlos, se mueven contra ese archivo.
 *
 * Criterios que no hay que "simplificar":
 *
 * - Todo se anima con `opacity` y `transform`, que resuelve el compositor. Nada
 *   de animar alturas ni tamaños de fuente.
 * - El texto está SIEMPRE en el HTML (sólo cambia su opacidad), así que la
 *   página se indexa y se lee con lector de pantalla aunque nunca se scrollee.
 *   La lista de palabras que viaja al centro es `aria-hidden`: repite palabras
 *   que ya están en los párrafos.
 * - Con `prefers-reduced-motion` el bloque se aplana: párrafos, palabras y
 *   botón visibles, sin tramo de scroll de más.
 *
 * El progreso lo mide `useSectionProgress`, que documenta por qué no se usa
 * `useScroll` acá.
 */

/** Límites de fase, en el progreso 0 → 1 del scroll dentro de la sección. */
const PHASE1_END = 0.28; // termina el reveal de los párrafos
const PHASE2_END = 0.55; // termina el apagado de los tramos de texto
const PHASE3_END = 0.78; // las palabras llegan al centro
const CTA_TRIGGER = 0.8; // umbral del botón (no es scrubbing: entra y sale entero)

/** Cuánto dura, en progreso, el apagado de cada tramo de texto. */
const SEGMENT_FADE = 0.1;
/** Lo que queda encendido de un tramo apagado: no se va a cero del todo. */
const SEGMENT_FLOOR = 0.08;

/**
 * De dónde sale cada palabra, en px respecto del centro. Son las posiciones
 * aproximadas que ocupa dentro del párrafo, para que el viaje se lea como que
 * la palabra se despega del texto y no como que aparece de la nada.
 */
const KEYWORD_START_OFFSETS = [
  { x: 120, y: -180 },
  { x: 100, y: -40 },
  { x: -90, y: 60 },
  { x: 110, y: 190 },
] as const;

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
  const { ref, progress } = useSectionProgress(!reduced);
  const story = useMemo(() => splitStory(paragraphs, keywords), [paragraphs, keywords]);

  // Fase 3: el bloque de texto se apaga entero mientras las palabras viajan.
  const textOpacity = useTransform(progress, [PHASE2_END, PHASE3_END], [1, 0]);
  // Las palabras entran rápido apenas arranca la fase, y ya no se apagan.
  const wordsOpacity = useTransform(progress, [PHASE2_END, PHASE2_END + 0.06], [0, 1]);
  const travel = useTransform(progress, [PHASE2_END, PHASE3_END], [0, 1]);

  const ctaVisible = useThreshold(progress, CTA_TRIGGER, !reduced);

  if (reduced) {
    return (
      <section
        id={id}
        className="w-full bg-[linear-gradient(to_bottom,#011360_0%,#020c41_100%)] px-margin-mobile py-24 md:px-margin-desktop"
      >
        <div className="mx-auto max-w-[760px] space-y-6">
          {story.paragraphs.map((pieces, i) => (
            <p key={i} className={PARAGRAPH_CLASS}>
              {pieces.map((piece, j) =>
                piece.keyword ? (
                  <span key={j} className={KEYWORD_CLASS}>
                    {piece.text}
                  </span>
                ) : (
                  <span key={j}>{piece.text}</span>
                )
              )}
            </p>
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
      className="relative h-[400vh] w-full bg-[linear-gradient(to_bottom,#011360_0%,#020c41_100%)]"
    >
      {/* El `pt` compensa el navbar: el sticky se pega al techo de la pantalla,
          que es justo donde está la banda opaca. */}
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden pt-16 lg:pt-21">
        <motion.div
          style={{ opacity: textOpacity }}
          className="relative z-[3] mx-auto max-w-[760px] px-[6vw]"
        >
          {story.paragraphs.map((pieces, i) => (
            <StoryParagraph
              key={i}
              progress={progress}
              index={i}
              total={story.paragraphs.length}
            >
              {pieces.map((piece, j) =>
                piece.keyword ? (
                  <span key={j} className={KEYWORD_CLASS}>
                    {piece.text}
                  </span>
                ) : (
                  <StorySegment
                    key={j}
                    progress={progress}
                    index={piece.segment}
                    total={story.segments}
                  >
                    {piece.text}
                  </StorySegment>
                )
              )}
            </StoryParagraph>
          ))}
        </motion.div>

        {/* Las palabras y el botón se apilan sobre el texto en la misma
            pantalla: el texto ya está apagándose cuando entran. */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: wordsOpacity }}
          className="pointer-events-none absolute inset-x-0 top-1/2 z-[3] -translate-y-1/2 text-center"
        >
          {keywords.map((word, i) => (
            <TravellingKeyword key={word} travel={travel} index={i}>
              {word}
            </TravellingKeyword>
          ))}
        </motion.div>

        <motion.div
          initial={false}
          animate={
            ctaVisible
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 20, scale: 0.85 }
          }
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-x-0 top-[calc(50%+190px)] z-[4] text-center"
          style={{ pointerEvents: ctaVisible ? "auto" : "none" }}
        >
          <StoryCta {...cta} />
        </motion.div>
      </div>
    </section>
  );
}

const PARAGRAPH_CLASS =
  "mb-[22px] text-[clamp(0.95rem,1.9vw,1.375rem)] leading-relaxed text-primary";
const KEYWORD_CLASS = "font-display font-semibold text-primary-container";

/**
 * Fase 4. El botón no hace scrubbing: cruza el umbral y entra con su propia
 * transición, y vuelve a salir si el usuario sube. Se suscribe al valor en vez
 * de leerlo en cada frame para que el `setState` sólo ocurra al cruzar.
 */
function useThreshold(progress: MotionValue<number>, at: number, enabled: boolean) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const sync = (v: number) => setPast((prev) => (prev === v >= at ? prev : v >= at));
    sync(progress.get());
    return progress.on("change", sync);
  }, [progress, at, enabled]);

  return past;
}

/**
 * Un `href` que arranca con `#` sale como `<a>` y no como `Link`, y encima se
 * maneja a mano. Dos motivos, los dos medidos en Chrome:
 *
 * - El `Link` de Next resuelve el salto con `pushState`, que **no dispara
 *   `hashchange`**, así que el `openOnHash` del `Collapsible` de destino no se
 *   entera y el panel queda cerrado.
 * - El ancla nativa sí cambia el hash, pero **no scrollea**: el botón vive
 *   dentro del sticky del relato y desde ahí el salto al fragmento no se
 *   aplica. Medido: el hash cambiaba y `scrollY` se quedaba igual.
 *
 * Por eso se hace explícito: se fija el hash (que dispara el evento y abre el
 * panel) y se scrollea con `scrollIntoView`, que respeta el `scroll-padding-top`
 * con el que el sitio compensa el navbar.
 *
 * Dos detalles medidos que no hay que "limpiar":
 *
 * - **El scroll va un frame después.** En el mismo tick, la navegación al
 *   fragmento que provoca fijar el hash le pisa el scroll y queda a mitad de
 *   camino (3538 en vez de 5316).
 * - **`behavior: "instant"`, no `smooth`.** El scroll suave disparado desde un
 *   click de mouse se cancela solo y la página no se mueve — con el teclado, o
 *   llamándolo 300ms después, el mismo código sí llega. Un salto seco además es
 *   lo que hace un ancla nativa, que es lo que este botón imita.
 *
 * Si el destino no existe no se toca nada y decide el browser. Para cualquier
 * otra ruta sigue siendo `Link`.
 */
function StoryCta({ label, href }: Cta) {
  const className =
    "inline-flex items-center gap-2 rounded-full border-[1.5px] border-primary-container bg-[linear-gradient(135deg,#f9d78f,#b3964b)] px-10 py-4 font-display text-label-sm font-bold uppercase text-[#05125a] transition-[filter] duration-300 hover:brightness-110";
  const content = (
    <>
      {label}
      <span aria-hidden="true">↗</span>
    </>
  );

  return href.startsWith("#") ? (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        const target = document.getElementById(href.slice(1));
        if (!target) return;
        event.preventDefault();
        window.location.hash = href;
        requestAnimationFrame(() =>
          target.scrollIntoView({ behavior: "instant", block: "start" })
        );
      }}
    >
      {content}
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

/** Fase 1: cada párrafo tiene su propia ventana de scroll, sólo opacidad. */
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
  const window_ = PHASE1_END / total;
  const opacity = useTransform(progress, [window_ * index, window_ * (index + 1)], [0, 1]);

  return (
    <motion.p style={{ opacity }} className={PARAGRAPH_CLASS}>
      {children}
    </motion.p>
  );
}

/** Fase 2: los tramos de texto blanco se apagan en orden, de a uno. */
function StorySegment({
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
  const start = PHASE1_END + (index / total) * (PHASE2_END - PHASE1_END);
  const opacity = useTransform(
    progress,
    [start, start + SEGMENT_FADE],
    [1, SEGMENT_FLOOR]
  );

  return <motion.span style={{ opacity }}>{children}</motion.span>;
}

/** Fase 3: la palabra viaja desde su lugar en el párrafo al centro, creciendo. */
function TravellingKeyword({
  children,
  travel,
  index,
}: {
  children: React.ReactNode;
  travel: MotionValue<number>;
  index: number;
}) {
  const from = KEYWORD_START_OFFSETS[index] ?? { x: 0, y: 0 };
  const x = useTransform(travel, [0, 1], [from.x, 0]);
  const y = useTransform(travel, [0, 1], [from.y, 0]);
  const scale = useTransform(travel, [0, 1], [0.6, 1]);

  return (
    <motion.span
      style={{ x, y, scale }}
      className="block font-display text-[clamp(1.5rem,5vw,3.625rem)] font-semibold leading-[1.35] text-primary-container"
    >
      {children}
    </motion.span>
  );
}

type Piece =
  | { keyword: true; text: string }
  | { keyword: false; text: string; segment: number };

/**
 * Parte los párrafos en tramos apagables y palabras clave.
 *
 * Dos detalles que no son adorno:
 *
 * - Sólo se marca la **primera** aparición de cada palabra. "conciencia" vuelve
 *   a aparecer en el tercer párrafo y ahí es texto común: si se marcara, el
 *   sitio tendría cinco palabras encendidas y sólo cuatro viajando al centro.
 * - Los tramos vecinos se fusionan, así el orden de apagado es el del mockup
 *   (siete tramos, no uno por trozo del split).
 */
function splitStory(paragraphs: readonly string[], keywords: readonly string[]) {
  const pattern = new RegExp(`(${keywords.map(escapeRegExp).join("|")})`, "gi");
  const seen = new Set<string>();
  let segment = 0;

  const out = paragraphs.map((paragraph) => {
    const pieces: Piece[] = [];

    for (const part of paragraph.split(pattern)) {
      if (!part) continue;

      const key = part.toLowerCase();
      const isKeyword = keywords.some((k) => k.toLowerCase() === key) && !seen.has(key);

      if (isKeyword) {
        seen.add(key);
        pieces.push({ keyword: true, text: part });
        continue;
      }

      const last = pieces[pieces.length - 1];
      if (last && !last.keyword) last.text += part;
      else pieces.push({ keyword: false, text: part, segment: segment++ });
    }

    return pieces;
  });

  return { paragraphs: out, segments: segment };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
