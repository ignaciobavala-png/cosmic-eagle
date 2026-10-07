"use client";

import { Link } from "@/i18n/navigation";
import { CTA_TONES } from "./CtaLink";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { useSectionProgress } from "@/lib/use-section-progress";
import { useSignedIn } from "@/lib/use-signed-in";
import { COLLAPSIBLE_TOGGLE } from "./Collapsible";

type Cta = { label: string; href: string };

/**
 * Una frase resaltada. `text` es como aparece DENTRO del parrafo y tambien en
 * el bloque final: la frase viaja del parrafo al centro, asi que si cambiara de
 * caja a mitad de camino se veria el salto. Por eso es UN solo string y tampoco
 * lleva `capitalize`: la regla de CSS pondria "Dimension Del Alma", con el
 * articulo en mayuscula. La caja la decide la clienta al escribir el parrafo.
 */
export type StoryKeyword = { text: string };

/**
 * El "scroll story" de la home: un tramo de scroll con el texto fijo en
 * pantalla, en **tres momentos** (pedido de Sofía, 06/10: "más directo, sin
 * tanto degradé"):
 *
 * 1. **Los tres párrafos**, enteros y juntos desde el arranque.
 * 2. **Sólo las palabras clave**: el texto blanco se apaga de una vez y las
 *    frases resaltadas se quedan en su lugar dentro del párrafo.
 * 3. **Las palabras se reúnen en el centro** y quedan unificadas en un solo
 *    bloque; después entra el botón.
 *
 * Lo que cambió el 06/10 respecto del motor de cuatro fases del mockup de
 * Julia: los párrafos ya no entran de a uno, el blanco se apaga entero y no
 * por tramos (que era el "degradé" que molestaba), y las palabras llegan en el
 * oro plano del sitio, sin el degradé de tres colores. El viaje al centro se
 * queda. **Ojo**: el 07/10 se lo sacó por error leyendo "párrafo unificado"
 * como "los párrafos vuelven juntos" y Ignacio lo marcó roto; el bloque
 * unificado son las palabras clave.
 *
 * Criterios que no hay que "simplificar":
 *
 * - Todo se anima con `opacity` y `transform`, que resuelve el compositor. Nada
 *   de animar alturas ni tamaños de fuente.
 * - El texto está SIEMPRE en el HTML (sólo cambia su opacidad), así que la
 *   página se indexa y se lee con lector de pantalla aunque nunca se scrollee.
 *   El bloque de palabras que viaja al centro es `aria-hidden`: repite frases
 *   que ya están en los párrafos.
 * - Con `prefers-reduced-motion` el bloque se aplana: párrafos y botón
 *   visibles, sin tramo de scroll de más.
 *
 * El progreso lo mide `useSectionProgress`, que documenta por qué no se usa
 * `useScroll` acá.
 */

/** Límites de los momentos, en el progreso 0 → 1 del scroll dentro de la sección. */
const DIM_START = 0.22; // fin del momento 1: el blanco empieza a apagarse
const DIM_END = 0.32; // momento 2: sólo las palabras clave, en su lugar
const TRAVEL_START = 0.42; // momento 3: las palabras salen hacia el centro...
const TRAVEL_END = 0.68; // ...y llegan, unificadas
const CTA_TRIGGER = 0.74; // umbral del botón (no es scrubbing: entra y sale entero)

/**
 * El relevo entre la frase del párrafo y su copia que viaja: lo que tarda la
 * copia en encenderse y la original en apagarse. Es el mismo tramo para las
 * dos, así que en cualquier punto se lee UNA sola vez (corrección del 09/09:
 * con las dos encendidas la frase se leía dos veces, corrida).
 */
const KEYWORD_HANDOFF = 0.04;

type Offset = { x: number; y: number };

/**
 * De donde sale cada palabra: la distancia entre el lugar que ocupa dentro del
 * parrafo y el lugar donde la espera el bloque final. **Se mide en vivo y no es
 * una constante** (correccion de Julia del 04/09).
 *
 * Tres cosas que no hay que "simplificar":
 *
 * - **Se remide en cada frame de scroll mientras el viaje todavia no arranco.**
 *   El contenido vive dentro de un `sticky`, y un sticky recien esta en su
 *   posicion final cuando el scroll lo pego al techo: medir una sola vez al
 *   montar da coordenadas de cuando la seccion estaba abajo de la pantalla.
 * - **El destino se calcula con `offsetLeft`/`offsetTop`, no con
 *   `getBoundingClientRect`.** El rect de la palabra del bloque ya viene movido
 *   por el transform de la medicion anterior, asi que medirlo con rect se
 *   realimenta; los offsets de layout son la posicion natural. Su contenedor si
 *   va con rect: es quien aporta la posicion en pantalla.
 * - **Se mide contra el destino real, no contra el centro de la pantalla**:
 *   cada palabra aterriza en su lugar dentro del bloque.
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
   * Los tres momentos en que hay que medir: después de `load` + doble rAF (que
   * las fuentes ya asentaron el layout), en cada `resize` (una frase cambia de
   * renglón entre anchos) y en cada frame de scroll antes del viaje (ver
   * `measureOffsets`).
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
      if (v < TRAVEL_START) measure();
    });

    return () => {
      alive = false;
      window.removeEventListener("load", run);
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
      stop();
    };
  }, [measure, progress, reduced]);

  // Momento 2: el texto blanco se apaga entero y de una. Las palabras clave no
  // pasan por acá: se quedan encendidas en su lugar hasta el relevo.
  const textOpacity = useTransform(progress, [DIM_START, DIM_END], [1, 0]);
  // Momento 3: el relevo y el viaje.
  const sourceOpacity = useTransform(
    progress,
    [TRAVEL_START, TRAVEL_START + KEYWORD_HANDOFF],
    [1, 0]
  );
  const wordsOpacity = useTransform(
    progress,
    [TRAVEL_START, TRAVEL_START + KEYWORD_HANDOFF],
    [0, 1]
  );
  const travel = useTransform(progress, [TRAVEL_START, TRAVEL_END], [0, 1]);
  // El gesto de entrada de los párrafos, el mismo de `RevealItem`: sin esto el
  // bloque se sentía "caído", como puesto de siempre (Ignacio, 24/09).
  const y = useTransform(progress, [0, 0.06], [22, 0]);

  const ctaVisible = useThreshold(progress, CTA_TRIGGER, !reduced);

  if (reduced) {
    return (
      <section
        id={id}
        className="w-full bg-[linear-gradient(to_bottom,#011360_0%,#020c41_100%)] px-margin-mobile py-24 md:px-margin-desktop"
      >
        <div className="mx-auto max-w-[820px] space-y-6">
          {story.map((pieces, i) => (
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
      className="relative h-[350vh] w-full bg-[linear-gradient(to_bottom,#011360_0%,#020c41_100%)]"
    >
      {/* El `pt` compensa el navbar: el sticky se pega al techo de la pantalla,
          que es justo donde está la banda opaca. `items-start` y no centrado:
          con el texto centrado en su propia pantalla quedaba otro tramo de aire
          justo donde termina el manifiesto (Ignacio, 24/09; organización,
          25/09). */}
      <div className="sticky top-0 flex h-[100svh] items-start overflow-hidden pt-[var(--navbar-h)] md:pt-[calc(var(--navbar-h)+3vh)]">
        <motion.div style={{ y }} className="relative z-[3] mx-auto max-w-[820px] px-[6vw]">
          {story.map((pieces, i) => (
            <p key={i} className={PARAGRAPH_CLASS}>
              {pieces.map((piece, j) =>
                piece.keyword ? (
                  <motion.span
                    key={j}
                    ref={(el) => {
                      sources.current[piece.index] = el;
                    }}
                    style={{ opacity: sourceOpacity }}
                    className={KEYWORD_CLASS}
                  >
                    {piece.text}
                  </motion.span>
                ) : (
                  <motion.span key={j} style={{ opacity: textOpacity }}>
                    {piece.text}
                  </motion.span>
                )
              )}
            </p>
          ))}
        </motion.div>

        {/* Las palabras y el botón viven en UN solo bloque centrado, apilado
            sobre el texto: así el conjunto queda con el mismo aire arriba y
            abajo una vez que el botón entra. El botón ocupa su lugar desde el
            arranque —sólo cambia de opacidad—, por eso el bloque no se mueve. */}
        <div className="pointer-events-none absolute inset-0 z-[3] flex flex-col items-center justify-center gap-[59px] px-[6vw] md:gap-10">
          {/* `relative` no es decoracion: `offsetLeft`/`offsetTop` se miden
              contra el ancestro POSICIONADO mas cercano, y sin esto las
              palabras salian de un punto que no existe. */}
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
                {word.text}
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

/**
 * La palabra viaja desde su lugar en el párrafo hasta su renglón del bloque
 * final, creciendo de 0,6 a 1.
 *
 * **El offset se lee del ref dentro de la funcion de transformacion**, no se
 * cierra sobre un valor: asi cada frame usa la ultima medicion. Mientras
 * `travel` vale 0 la palabra esta en opacidad 0, asi que no importa que el
 * valor no se recalcule hasta que el viaje arranca.
 *
 * Oro plano (`primary-container`), el mismo de la frase en el párrafo: el
 * degradé de tres colores que llevaba se fue con el pedido de Sofía del 06/10.
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
      className="block font-display text-[32px] font-semibold leading-[47px] text-primary-container"
    >
      {children}
    </motion.span>
  );
}

/**
 * **La medida del texto sigue al ALTO de la pantalla, no sólo al ancho.** El
 * bloque vive dentro de un sticky de `100svh` con `overflow-hidden` y centrado
 * en flex: si el texto no entra, no hay scroll que valga — se recorta arriba y
 * abajo, y no hay forma de leer lo que quedó afuera.
 *
 * Medido antes del arreglo (1440px de ancho): con la pantalla en 660px de alto
 * el bloque ya no entraba, y en 578px se comian dos lineas arriba — el parrafo
 * arrancaba en "comenzamos a descubrir que". Pasa con la ventana a media
 * pantalla, con el zoom del browser arriba del 125% y en un portatil bajo.
 *
 * De ahi el `min(1.9vw, 3.1vh)`: en una pantalla normal manda el ancho y el
 * tamaño es exactamente el de antes (el tope de 1.375rem se alcanza igual), y
 * sólo cuando la pantalla es baja toma el mando el alto. El margen entre
 * párrafos sigue la misma regla.
 */
const PARAGRAPH_CLASS =
  "mb-[clamp(12px,2.4vh,22px)] text-[clamp(0.95rem,min(1.9vw,3.1vh),1.375rem)] leading-relaxed text-primary";
/**
 * La frase resaltada DENTRO del parrafo.
 *
 * Va en la **serif**: Sofia comparo los dos tratamientos y eligio ese (15/09).
 *
 * **El `text-[1.18em]` no es decorativo y no se saca.** Sorts Mill Goudy tiene
 * la altura de x un 18% mas baja que Montserrat (medido: 45 contra 53 a 100px
 * de cuerpo), asi que a igual `font-size` la frase se ve mas chica que el
 * renglon en el que vive, como si estuviera en otro cuerpo. Ese es exactamente
 * el bug que hizo que el 09/09 se le sacara la serif — la solucion de entonces
 * fue volver a Montserrat, la de ahora es compensar el cuerpo. El factor iguala
 * las MINUSCULAS, que es lo que se ve: las cuatro frases son todas minusculas.
 *
 * Va en `em` y no en px para que siga al `clamp` del parrafo, que depende del
 * ancho Y del alto de la pantalla.
 *
 * El `font-semibold` renderiza como regular: la serif solo existe en peso 400 y
 * `globals.css` corta el faux bold con `font-synthesis-weight`.
 *
 */
const KEYWORD_CLASS =
  "font-display text-[1.18em] font-semibold text-primary-container";

/**
 * El botón no hace scrubbing: cruza el umbral y entra con su propia
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
  // EL boton del sistema, el mismo de `CtaLink` (estandarizacion del 15/09).
  // Aca las clases van copiadas y no el componente porque esto no navega:
  // intercepta el click para abrir la cartelera, que esta 400vh mas abajo
  // dentro del sticky de este mismo relato (ver el comentario de arriba).
  // Se escapo de la primera pasada justamente por no ser un `CtaLink`.
  //
  // Pedido de Sofia (24/09): sin sesion, "Explorar experiencias" lleva a
  // login en vez de a /viajes. Solo aplica a un `href` real (no a los "#"
  // que abren la cartelera in-page, que no son navegacion a Experiencias).
  const signedIn = useSignedIn();
  const resolvedHref =
    !href.startsWith("#") && signedIn === false ? "/cuenta" : href;
  const className =
    `inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] px-10 py-4 font-display text-[14px] uppercase tracking-[0.071em] transition-[color,background-color,border-color,box-shadow,transform] duration-[250ms] hover:scale-[1.04] ${CTA_TONES.gold}`;
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
    <Link href={resolvedHref} className={className}>
      {content}
    </Link>
  );
}

type Piece =
  | { keyword: true; text: string; index: number }
  | { keyword: false; text: string };

/**
 * Parte los párrafos en texto común y frases clave. Sólo se marca la
 * **primera** aparición de cada frase: "conciencia" vuelve a aparecer más
 * adelante y ahí es texto común.
 */
function splitStory(paragraphs: readonly string[], keywords: readonly StoryKeyword[]) {
  // Las frases largas primero: si "conciencia" se probara antes que una frase
  // que la contenga, la alternancia cortaria por la corta.
  const ordered = [...keywords].map((k) => k.text).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${ordered.map(escapeRegExp).join("|")})`, "gi");
  const seen = new Set<string>();

  return paragraphs.map((paragraph) => {
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
      else pieces.push({ keyword: false, text: part });
    }

    return pieces;
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
