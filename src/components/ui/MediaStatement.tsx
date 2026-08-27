import Image from "next/image";
import { Reveal } from "./Reveal";

/**
 * Pantalla completa de imagen con un velo azul encima y una frase centrada.
 *
 * En los HTML de Julia este bloque aparece tres veces (`.atmos` de la home,
 * `.exp-banner` de experiencias, `.nos-video` de nosotros) y en dos de ellas
 * pide un video de fondo. **Mientras no lleguen los videos va la imagen**, que
 * es el mismo componente con otra fuente; cuando lleguen, se cambia el `<Image>`
 * por un `<video>` con `poster={image}` y el resto queda igual.
 *
 * El velo NO es decorativo: la frase es texto claro sobre foto, y sin el velo
 * el contraste depende de que zona de la imagen toque. Va como capa aparte y no
 * como filtro sobre el `<Image>` para no volver a pintar la foto en cada frame.
 */
export function MediaStatement({
  image,
  imageAlt = "",
  text,
  id,
  veil = 0.45,
}: {
  image: string;
  imageAlt?: string;
  text: string;
  id?: string;
  veil?: number;
}) {
  return (
    <section
      id={id}
      className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden"
    >
      <Image
        src={image}
        alt={imageAlt}
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#05125a]"
        style={{ opacity: veil }}
      />
      <Reveal className="relative z-10 max-w-2xl px-margin-mobile text-center md:px-margin-desktop">
        <p className="font-display text-headline-md text-primary md:text-headline-lg text-balance">
          {text}
        </p>
      </Reveal>
    </section>
  );
}
