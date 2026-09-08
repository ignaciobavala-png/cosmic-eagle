"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { useSectionProgress } from "@/lib/use-section-progress";
import { COLLAPSIBLE_TOGGLE } from "./Collapsible";

type Cta = { label: string; href: string };

/**
 * Una frase resaltada. `text` es como aparece DENTRO del parrafo (en minuscula,
 * tal cual la escribio la clienta) y `label` como se lee en la lista final, que
 * va en capitular. Son dos strings y no uno con `capitalize`: la regla de CSS
 * pondria "Dimension Del Alma", con el articulo en mayuscula.
 */
export type StoryKeyword = { text: string; label: string };

/**
 * El "scroll story" de la home: un tramo largo de scroll durante el cual el
 * texto se destila —los párrafos aparecen uno a uno, después el texto blanco se
 * apaga por tramos y quedan encendidas sólo las palabras clave, que viajan
 * desde su lugar en el párrafo hasta el centro y se agrandan— y al final entra
 * el botón.
 *
 * Las cuatro fases y sus umbrales salen literales del mockup aprobado de Julia
 * (`homepage_correccion.html`, motor "SCROLL STORY"), con la correccion del
 * 04/09 (`docs/entregas/2026-09-04-julia-about/`): posiciones de salida MEDIDAS
 * en vivo y degrade de tres colores en la lista final. No son valores elegidos
 * aca: si hay que moverlos, se mueven contra esos archivos.
 *
 * **El fondo se queda en el degrade azul y NO lleva imagen**, que es lo unico de
 * esa entrega que no entro: se probo con la foto a pantalla completa y quedaba
 * mejor sin (decision de Ignacio, 08/09). De paso se evita el problema que traia:
 * sobre las zonas claras de una foto el texto blanco caia a 1,57:1 y habia que
 * taparla con un velo del 40%, o sea casi volver al fondo plano.
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

type Offset = { x: number; y: number };

/**
 * De donde sale cada palabra: la distancia entre el lugar que ocupa dentro del
 * parrafo y el lugar donde la espera la lista final. **Se mide en vivo y no es
 * una constante** — era lo que estaba mal y por eso las cuatro parecian salir
 * del mismo lugar (correccion de Julia del 04/09).
 *
 * Tres cosas que no hay que "simplificar":
 *
 * - **Se remide en cada frame de scroll mientras la fase 3 todavia no arranco.**
 *   El contenido vive dentro de un `sticky`, y un sticky recien esta en su
 *   posicion final cuando el scroll lo pego al techo: medir una sola vez al
 *   montar da coordenadas de cuando la seccion estaba abajo de la pantalla. Es
 *   primo del bug de `useScroll`/`ViewTimeline` del 28/08 — compila igual y se
 *   ve mal.
 * - **El destino se calcula con `offsetLeft`/`offsetTop`, no con
 *   `getBoundingClientRect`.** El rect de la palabra de la lista ya viene movido
 *   por el transform de la medicion anterior, asi que medirlo con rect se
 *   realimenta; los offsets de layout son la posicion natural, ajena al
 *   transform del propio elemento. Su contenedor si va con rect: es quien
 *   aporta la posicion en pantalla.
 * - **Se mide contra el destino real, no contra el centro de la pantalla.** El
 *   mockup usa el centro porque ahi la lista es un bloque suelto; aca cada
 *   palabra aterriza en su renglon, y restar el centro la haria salir corrida
 *   medio bloque. El principio que pide la entrega es que cada frase se despegue
 *   de su lugar en el parrafo, y esto lo cumple exacto.
 */
function measureOffsets(
  sources: (HTMLElement | null)[],
  targets: (HTMLElement | null)[],
  frame: HTMLElement | null,
  previous: Offset[]
): Offset[] {
  if (!frame) return previous;
  const box = frame.getBoundingClientRect();

  return sources.map((source, i) => {
    const target = targets[i];
    if (!source || !target) return previous[i] ?? { x: 0, y: 0 };

    const from = source.getBoundingClientRect();
    return {
      x:
        from.left +
        from.width / 2 -
        (box.left + target.offsetLeft + target.offsetWidth / 2),
      y:
        from.top +
        from.height / 2 -
        (box.top + target.offsetTop + target.offsetHeight / 2),
    };
  });
}

export function ScrollStory({
  paragraphs,
  keywords,
  cta,
  id,
}: {
  paragraphs: readonly string[];
  keywords: readonly StoryKeyword[];
  cta: Cta;
  id?: string;
}) {
  const reduced = useReducedMotion();
  const { ref, progress } = useSectionProgress(!reduced);
  const story = useMemo(() => splitStory(paragraphs, keywords), [paragraphs, keywords]);

  // De donde sale cada palabra y a donde llega: los tres refs que alimentan la
  // medicion (ver `measureOffsets`).
  const sources = useRef<(HTMLElement | null)[]>([]);
  const targets = useRef<(HTMLElement | null)[]>([]);
  const frame = useRef<HTMLDivElement>(null);
  const offsets = useRef<Offset[]>([]);

  const measure = useCallback(() => {
    offsets.current = measureOffsets(
      sources.current,
      targets.current,
      frame.current,
      offsets.current
    );
  }, []);

  /**
   * Los tres momentos en que hay que medir, y los tres hacen falta:
   *
   * 1. **Despues de `load` + doble rAF**, para no medir contra la fuente de
   *    respaldo mientras Domine y Montserrat todavia no asentaron el layout.
   *    Es la misma espera que arma el observador de `Reveal`.
   * 2. **En cada `resize`**, con 150ms de gracia: una frase que ocupa un renglon
   *    en escritorio ocupa dos en mobile, y su lugar en el parrafo cambia.
   * 3. **En cada frame de scroll mientras la fase 3 no arranco** — el motivo
   *    esta en `measureOffsets`.
   */
  useEffect(() => {
    if (reduced) return;

    let alive = true;
    const run = () =>
      requestAnimationFrame(() => requestAnimationFrame(() => alive && measure()));

    if (document.readyState === "complete") run();
    else window.addEventListener("load", run, { once: true });

    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(measure, 150);
    };
    window.addEventListener("resize", onResize);

    const stop = progress.on("change", (v) => {
      if (v < PHASE2_END) measure();
    });

    return () => {
      alive = false;
      window.removeEventListener("load", run);
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
      stop();
    };
  }, [measure, progress, reduced]);

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
        <div className="mx-auto max-w-[820px] space-y-6">
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
          <div className="pt-14">
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
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden pt-[var(--navbar-h)]">
        <motion.div
          style={{ opacity: textOpacity }}
          className="relative z-[3] mx-auto max-w-[820px] px-[6vw]"
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
                  <span
                    key={j}
                    ref={(el) => {
                      sources.current[piece.index] = el;
                    }}
                    className={KEYWORD_CLASS}
                  >
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
            pantalla: el texto ya está apagándose cuando entran.

            Los dos viven en UN solo bloque centrado (el `.story-outcome` de la
            spec) y no cada uno con su posicion: asi el conjunto lista + botón
            queda con el mismo aire arriba y abajo una vez que el botón entra.
            Si la lista se centrara sola, al aparecer el botón el conjunto
            quedaria pesado abajo. El botón ocupa su lugar desde el arranque
            —solo cambia de opacidad—, por eso el bloque no se mueve. */}
        <div className="pointer-events-none absolute inset-0 z-[3] flex flex-col items-center justify-center gap-[59px] px-[6vw] md:gap-10">
          {/* `relative` no es decoracion: `offsetLeft`/`offsetTop` se miden
              contra el ancestro POSICIONADO mas cercano, y sin esto ese
              ancestro era el contenedor de inset-0 — la posicion del bloque
              dentro de el se sumaba dos veces y las palabras salian de un punto
              que no existe. Medido: 558px a la izquierda y 308 arriba. */}
          <motion.div
            ref={frame}
            aria-hidden="true"
            style={{ opacity: wordsOpacity }}
            className="relative text-center"
          >
            {keywords.map((word, i) => (
              <TravellingKeyword
                key={word.text}
                travel={travel}
                offsets={offsets}
                index={i}
                register={(el) => {
                  targets.current[i] = el;
                }}
              >
                {word.label}
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
            className="text-center"
            style={{ pointerEvents: ctaVisible ? "auto" : "none" }}
          >
            <StoryCta {...cta} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const PARAGRAPH_CLASS =
  "mb-[22px] text-[clamp(0.95rem,1.9vw,1.375rem)] leading-relaxed text-primary";
/**
 * La frase resaltada DENTRO del parrafo: Domine bold, dorado claro SOLIDO.
 * No lleva degrade — el degrade es exclusivo de la lista final. Comparten
 * tipografia y color de arranque y por eso se confunden, pero son dos
 * tratamientos distintos y la entrega del 04/09 pide no fusionarlos.
 */
const KEYWORD_CLASS = "font-display font-bold text-primary-container";

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
    "inline-flex items-center rounded-full border-[1.5px] border-primary-container bg-[linear-gradient(135deg,#f9d78f,#b3964b)] px-10 py-4 font-display text-[14px] font-bold uppercase tracking-[0.071em] text-[#05125a] transition-[filter] duration-300 hover:brightness-110";
  // Sin flecha adentro: la regla de Julia del 08/09 es que ningun boton la
  // lleve, solo su texto.
  const content = <>{label}</>;

  return href.startsWith("#") ? (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        const target = document.getElementById(href.slice(1));
        if (!target) return;
        event.preventDefault();

        // Si hay un panel escuchando (la cartelera), el que decide es el:
        // alterna entre abierto y cerrado y hace el salto cuando corresponde.
        // Se entera de que lo atendieron porque el evento vuelve cancelado.
        const toggle = new CustomEvent(COLLAPSIBLE_TOGGLE, {
          detail: href.slice(1),
          cancelable: true,
        });
        const handled = !window.dispatchEvent(toggle);
        if (handled) return;

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

/**
 * Fase 3: la palabra viaja desde su lugar en el párrafo hasta su renglón de la
 * lista, creciendo de 0,6 a 1.
 *
 * **El offset se lee del ref dentro de la funcion de transformacion**, no se
 * cierra sobre un valor: asi cada frame usa la ultima medicion en vez de la que
 * habia cuando se monto el componente, que es justo el bug que corrige esta
 * entrega. Mientras `travel` vale 0 la palabra esta en opacidad 0, asi que no
 * importa que el valor no se recalcule hasta que el viaje arranca.
 *
 * El degrade de tres colores va por renglon (cada palabra es su propio bloque),
 * asi que corre de punta a punta de ESA linea. Es intencional: la lista entera
 * con un solo degrade continuo se ve distinto.
 */
function TravellingKeyword({
  children,
  travel,
  offsets,
  index,
  register,
}: {
  children: React.ReactNode;
  travel: MotionValue<number>;
  offsets: React.RefObject<Offset[]>;
  index: number;
  register: (el: HTMLElement | null) => void;
}) {
  const x = useTransform(travel, (t) => (offsets.current[index]?.x ?? 0) * (1 - t));
  const y = useTransform(travel, (t) => (offsets.current[index]?.y ?? 0) * (1 - t));
  const scale = useTransform(travel, [0, 1], [0.6, 1]);

  return (
    <motion.span
      ref={register}
      style={{ x, y, scale }}
      className="block bg-[linear-gradient(90deg,#f9d78f,#b3964b,#f9d78f)] bg-clip-text font-display text-[32px] font-semibold leading-[47px] text-transparent"
    >
      {children}
    </motion.span>
  );
}

type Piece =
  | { keyword: true; text: string; index: number }
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
function splitStory(paragraphs: readonly string[], keywords: readonly StoryKeyword[]) {
  // Las frases largas primero: si "conciencia" se probara antes que una frase
  // que la contenga, la alternancia cortaria por la corta.
  const ordered = [...keywords].map((k) => k.text).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${ordered.map(escapeRegExp).join("|")})`, "gi");
  const seen = new Set<string>();
  let segment = 0;

  const out = paragraphs.map((paragraph) => {
    const pieces: Piece[] = [];

    for (const part of paragraph.split(pattern)) {
      if (!part) continue;

      const key = part.toLowerCase();
      const isKeyword =
        keywords.some((k) => k.text.toLowerCase() === key) && !seen.has(key);

      if (isKeyword) {
        seen.add(key);
        pieces.push({
          keyword: true,
          text: part,
          index: keywords.findIndex((k) => k.text.toLowerCase() === key),
        });
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

