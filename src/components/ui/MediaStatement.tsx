import { BackgroundMedia } from "./BackgroundMedia";
import { ScrollIndicator } from "./ScrollIndicator";
import { Reveal } from "./Reveal";
import { ScrollHintButton } from "./ScrollHintButton";

/**
 * Pantalla completa de imagen con un velo azul encima y una frase centrada.
 *
 * En los HTML de Julia este bloque aparece tres veces (`.atmos` de la home,
 * `.exp-banner` de experiencias, `.nos-video` de nosotros) y en dos de ellas
 * pide un video de fondo. El slot acepta las dos cosas: `BackgroundMedia`
 * resuelve si lo cargado es foto o clip, asi que la clienta pasa de una a otro
 * desde el panel sin que haya que tocar nada aca.
 *
 * El velo NO es decorativo: la frase es texto claro sobre foto, y sin el velo
 * el contraste depende de que zona de la imagen toque. Va como capa aparte y no
 * como filtro sobre el `<Image>` para no volver a pintar la foto en cada frame.
 */
export function MediaStatement({
  image,
  imageAlt = "",
  text,
  children,
  id,
  veil = 0.45,
  overlay = true,
  scrollHint,
  scrollIndicator,
  height,
  textClassName,
  width = "narrow",
  amount = 0.4,
  once = true,
  y = 30,
  duration = 1,
}: {
  image: string;
  imageAlt?: string;
  /** Frase suelta, centrada y en serif. Es el uso corriente del bloque. */
  text?: string;
  /** Alternativa a `text` para varios parrafos (el "About" de /viajes). */
  children?: React.ReactNode;
  id?: string;
  veil?: number;
  /**
   * false deja el banner solo con la imagen: sin velo ni texto. Es el tilde
   * "Mostrar el texto" del panel de multimedia (`*.overlay`).
   */
  overlay?: boolean;
  /**
   * Indicador de scroll al pie ("SOBRE NOSOTROS" en /nosotros). Se mantiene
   * aunque el overlay este apagado, como el hint del hero: es navegacion.
   */
  scrollHint?: { label: string; target: string };
  /**
   * El indicador circular con etiqueta debajo (`.scroll-ind-labeled`). En la
   * home lo llevan Atmosférica ("NUESTRO PROPÓSITO") y Nuestro propósito
   * ("NUESTRAS EXPERIENCIAS"); es distinto de `scrollHint`, ver
   * `ScrollIndicator`.
   */
  scrollIndicator?: { label: string; target: string };
  /**
   * Alto fijo en px. En el mockup dos de estos bloques NO son de pantalla
   * completa: Atmosférica mide 900px y el Cierre 600px, y el design system lo
   * marca como "fijos, no responsive de alto". Sin este valor el bloque sigue
   * siendo `100svh`, que es lo que piden /viajes y /nosotros.
   */
  height?: number;
  /** Tamaño de la frase cuando el mockup fija un px (28px en Atmosférica, 32px en el Cierre). */
  textClassName?: string;
  width?: "narrow" | "prose";
  /**
   * Los valores por defecto son los de la frase atmosferica de la home (umbral
   * 0.4, 30px, 1s). En /viajes el mismo bloque usa el estandar de Experiencias
   * (0.22, 24px, 0.9s) y ademas es reversible.
   */
  amount?: number;
  once?: boolean;
  y?: number;
  duration?: number;
}) {
  return (
    <section
      id={id}
      className={`relative flex w-full items-center justify-center overflow-hidden ${
        height ? "" : "min-h-[100svh]"
      }`}
      style={height ? { height: `${height}px` } : undefined}
    >
      <BackgroundMedia src={image} alt={imageAlt} />
      {overlay && (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[#05125a]"
            style={{ opacity: veil }}
          />
          <Reveal
            amount={amount}
            once={once}
            y={y}
            duration={duration}
            className={`relative z-10 px-margin-mobile md:px-margin-desktop ${
              width === "prose" ? "max-w-3xl" : "max-w-2xl text-center"
            }`}
          >
            {text && (
              <p
                className={`font-display text-primary text-balance ${
                  textClassName ?? "text-headline-md md:text-headline-lg"
                }`}
              >
                {text}
              </p>
            )}
            {children}
          </Reveal>
        </>
      )}
      {scrollIndicator && (
        <ScrollIndicator
          label={scrollIndicator.label}
          target={scrollIndicator.target}
        />
      )}
      {scrollHint && (
        <ScrollHintButton
          label={scrollHint.label}
          target={scrollHint.target}
          tone="light"
        />
      )}
    </section>
  );
}
