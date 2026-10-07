"use client";

import { Link } from "@/i18n/navigation";
import { CTA_TONES } from "./CtaLink";
import { useEffect, useMemo, useState } from "react";
import { motion, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { useSectionProgress } from "@/lib/use-section-progress";
import { useSignedIn } from "@/lib/use-signed-in";
import { COLLAPSIBLE_TOGGLE } from "./Collapsible";

type Cta = { label: string; href: string };

/**
 * Una frase resaltada. `text` es como aparece DENTRO del parrafo, literal: la
 * caja la decide la clienta al escribir el parrafo.
 */
export type StoryKeyword = { text: string };

/**
 * El "scroll story" de la home: un tramo de scroll con el texto fijo en
 * pantalla, en **tres momentos** (pedido de Sofía, 06/10: "más directo, sin
 * tanto degradé"):
 *
 * 1. **Los tres párrafos**, enteros y juntos.
 * 2. **Sólo las palabras clave**: el texto blanco se apaga de una vez y las
 *    frases resaltadas se quedan en su lugar dentro del párrafo.
 * 3. **El cierre**: los tres párrafos vuelven juntos, de una —no de a uno—, y
 *    entra el botón.
 *
 * Hasta el 06/10 era el motor de cuatro fases del mockup de Julia: párrafos
 * que entraban de a uno, el blanco apagándose por tramos y las palabras
 * viajando al centro con un degradé de tres colores. Eso se fue entero (con el
 * `KEYWORD_HANDOFF` y la medición en vivo de offsets que lo sostenían; están en
 * la historia de git si alguna vez vuelve).
 *
 * Criterios que no hay que "simplificar":
 *
 * - Todo se anima con `opacity` y `transform`, que resuelve el compositor.
 * - El texto está SIEMPRE en el HTML (sólo cambia su opacidad), así que la
 *   página se indexa y se lee con lector de pantalla aunque nunca se scrollee.
 * - Con `prefers-reduced-motion` el bloque se aplana: párrafos y botón
 *   visibles, sin tramo de scroll de más.
 *
 * El progreso lo mide `useSectionProgress`, que documenta por qué no se usa
 * `useScroll` acá.
 */

/** Límites de los momentos, en el progreso 0 → 1 del scroll dentro de la sección. */
const DIM_START = 0.3; // fin del momento 1: el blanco empieza a apagarse
const DIM_END = 0.4; // momento 2: sólo las palabras clave
const BACK_START = 0.62; // el blanco vuelve...
const BACK_END = 0.72; // ...entero y de una: momento 3
const CTA_TRIGGER = 0.74; // umbral del botón (no es scrubbing: entra y sale entero)

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

  // El texto blanco: encendido, apagado del todo, encendido otra vez. Las
  // palabras clave no pasan por acá: quedan fijas en 1 los tres momentos.
  const textOpacity = useTransform(
    progress,
    [DIM_START, DIM_END, BACK_START, BACK_END],
    [1, 0, 0, 1]
  );
  // El gesto de entrada de los párrafos, el mismo de `RevealItem`: sin esto el
  // bloque se sentía "caído", como puesto de siempre (Ignacio, 24/09).
  const y = useTransform(progress, [0, 0.06], [22, 0]);

  const ctaVisible = useThreshold(progress, CTA_TRIGGER, !reduced);

  const renderPieces = (pieces: Piece[], animated: boolean) =>
    pieces.map((piece, j) =>
      piece.keyword ? (
        <span key={j} className={KEYWORD_CLASS}>
          {piece.text}
        </span>
      ) : animated ? (
        <motion.span key={j} style={{ opacity: textOpacity }}>
          {piece.text}
        </motion.span>
      ) : (
        <span key={j}>{piece.text}</span>
      )
    );

  if (reduced) {
    return (
      <section
        id={id}
        className="w-full bg-[linear-gradient(to_bottom,#011360_0%,#020c41_100%)] px-margin-mobile py-24 md:px-margin-desktop"
      >
        <div className="mx-auto max-w-[820px] space-y-6">
          {story.map((pieces, i) => (
            <p key={i} className={PARAGRAPH_CLASS}>
              {renderPieces(pieces, false)}
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
      className="relative h-[300vh] w-full bg-[linear-gradient(to_bottom,#011360_0%,#020c41_100%)]"
    >
      {/* El `pt` compensa el navbar: el sticky se pega al techo de la pantalla,
          que es justo donde está la banda opaca. `items-start` y no centrado:
          con el texto centrado en su propia pantalla quedaba otro tramo de aire
          justo donde termina el manifiesto (Ignacio, 24/09; organización,
          25/09). */}
      <div className="sticky top-0 flex h-[100svh] flex-col items-center overflow-hidden pt-[var(--navbar-h)] md:pt-[calc(var(--navbar-h)+3vh)]">
        <motion.div style={{ y }} className="relative z-[3] mx-auto max-w-[820px] px-[6vw]">
          {story.map((pieces, i) => (
            <p key={i} className={PARAGRAPH_CLASS}>
              {renderPieces(pieces, true)}
            </p>
          ))}
        </motion.div>

        {/* El botón ocupa su lugar desde el arranque —sólo cambia de
            opacidad—, así el texto no salta cuando entra. */}
        <motion.div
          initial={false}
          animate={
            ctaVisible
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 20, scale: 0.85 }
          }
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-[3] mt-[clamp(16px,4vh,48px)] text-center"
          style={{ pointerEvents: ctaVisible ? "auto" : "none" }}
        >
          <StoryCta {...cta} />
        </motion.div>
      </div>
    </section>
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

type Piece = { keyword: boolean; text: string };

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
        pieces.push({ keyword: true, text: part });
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
