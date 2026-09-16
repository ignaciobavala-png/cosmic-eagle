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
  mobileFull = false,
  imagePositionMobile,
  textClassName,
  textColorClassName = "text-primary",
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
  /**
   * Con `height`, en mobile el bloque ocupa UNA pantalla igual y el alto fijo
   * vale recien de `md` para arriba.
   *
   * Existe por el pedido de Sofia del 16/09: en mobile una pantalla tiene que
   * mostrar un solo fondo, y un banner de 600px sobre un telefono de 844
   * siempre deja 244px de la franja vecina asomando. Medido en tres pantallas
   * (360/390/412): el Cierre ocupaba entre el 66% y el 81% de la pantalla.
   *
   * **El alto va por variable CSS y no como `height` en el `style`**: un
   * estilo en linea no tiene breakpoint, y una clase `md:h-...` nunca le
   * ganaria. La variable la lee la clase, que si entiende de media queries.
   */
  mobileFull?: boolean;
  /**
   * Clase de `object-position` que se aplica **solo en mobile** (va con el
   * prefijo `max-md:` escrito por quien la pasa), para elegir que parte de la
   * foto sobrevive al recorte.
   *
   * Por que hace falta: la caja de un banner de pantalla completa es apaisada
   * en escritorio y vertical en el telefono, y el panel recorta lo que sube la
   * clienta a 16:9. En una foto de sujeto ancho, el recorte de mobile se queda
   * con una tajada muy angosta —en el banner de /nosotros, medido, el 26% del
   * ancho— y por defecto esa tajada sale del centro, que puede no ser donde
   * esta lo que importa.
   *
   * **Ojo**: el valor apunta a una foto concreta. Si la clienta cambia la
   * imagen del slot desde /admin/multimedia, el encuadre de mobile hay que
   * volver a mirarlo. Por eso se usa donde el recorte automatico realmente
   * arruina la foto, y no como ajuste fino en todos los banners.
   */
  imagePositionMobile?: string;
  /** Tamaño de la frase cuando el mockup fija un px (28px en Atmosférica, 32px en el Cierre). */
  textClassName?: string;
  /**
   * Color de la frase. Por defecto el blanco cálido del sistema.
   *
   * **Va por esta prop y no dentro de `textClassName`**: las dos utilidades de
   * color compiten por la misma propiedad y entre dos de la misma
   * especificidad decide el orden de la hoja generada, no el orden en que se
   * escriben — o sea que el `text-primary` de acá le ganaría. Es la misma
   * trampa que ya documentan `CtaLink`, `CreamSection` y `ScrollHintButton`.
   */
  textColorClassName?: string;
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
        height
          ? mobileFull
            ? "h-[100svh] md:h-[var(--band-h)]"
            : ""
          : "min-h-[100svh]"
      }`}
      style={
        height
          ? mobileFull
            ? ({ "--band-h": `${height}px` } as React.CSSProperties)
            : { height: `${height}px` }
          : undefined
      }
    >
      {/* El `object-cover` se escribe aca y no se delega al default de
          `BackgroundMedia`: la prop REEMPLAZA su `className`, asi que si se
          pasa solo la posicion se pierde el recorte. */}
      <BackgroundMedia
        src={image}
        alt={imageAlt}
        className={`object-cover${imagePositionMobile ? ` ${imagePositionMobile}` : ""}`}
      />
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
                className={`font-display text-balance ${textColorClassName} ${
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
