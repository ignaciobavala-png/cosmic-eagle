import { BackgroundMedia } from "./BackgroundMedia";
import { Reveal } from "./Reveal";

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
  width = "narrow",
}: {
  image: string;
  imageAlt?: string;
  /** Frase suelta, centrada y en serif. Es el uso corriente del bloque. */
  text?: string;
  /** Alternativa a `text` para varios parrafos (el "About" de /viajes). */
  children?: React.ReactNode;
  id?: string;
  veil?: number;
  width?: "narrow" | "prose";
}) {
  return (
    <section
      id={id}
      className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden"
    >
      <BackgroundMedia src={image} alt={imageAlt} />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#05125a]"
        style={{ opacity: veil }}
      />
      <Reveal
        className={`relative z-10 px-margin-mobile md:px-margin-desktop ${
          width === "prose" ? "max-w-3xl" : "max-w-2xl text-center"
        }`}
      >
        {text && (
          <p className="font-display text-headline-md text-primary md:text-headline-lg text-balance">
            {text}
          </p>
        )}
        {children}
      </Reveal>
    </section>
  );
}
