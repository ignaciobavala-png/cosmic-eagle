import Image from "next/image";
import { tripPlaceholderImage } from "@/lib/constants";

/**
 * La portada de un viaje, en sus dos usos: la tarjeta del listado y el banner
 * del detalle. **Es la unica pieza que decide como se recorta una portada** —
 * antes cada lugar tenia su propio alto y su propio recorte, y la misma imagen
 * se veia distinta segun donde cayera.
 *
 * El estandar, completo, esta en `docs/PORTADAS.md`. En corto:
 *
 * - **Se sube UNA sola imagen, en 16:9** (el form del admin la recorta sola a
 *   esa proporcion, asi que no depende de que la clienta la prepare bien).
 * - Cada uso recorta **desde el centro** con `object-cover`: nunca deforma, solo
 *   descarta borde. La tarjeta (4:3) come de los lados; el banner (21:9) come de
 *   arriba y abajo.
 * - De ahi sale la **zona segura**: lo que importa de la foto tiene que entrar en
 *   el **75% central** de ambos ejes. Eso es lo que sobrevive a los dos recortes.
 *
 * Los altos van por `aspect-ratio` y no en pixeles a proposito: con un alto fijo
 * el recorte cambia con el ancho del viewport y deja de ser predecible.
 */

const VARIANTS = {
  /** Tarjeta del listado y de la home. Recorta los lados. */
  card: {
    aspect: "aspect-[4/3]",
    sizes: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  },
  /**
   * Tarjeta de la cartelera (el carrusel dorado). Es la proporcion en la que se
   * GUARDA la portada, asi que no recorta nada, y deja la franja apaisada del
   * diseno de Julia (`calendariodeviajes_design.png`) en vez del 4:3 alto.
   */
  strip: {
    aspect: "aspect-[16/9]",
    sizes: "(min-width: 640px) 20rem, 17rem",
  },
  /**
   * Banner del detalle. En mobile se acerca al 4:3 porque el titulo va encima:
   * con 21:9 en pantalla angosta la franja queda mas baja que el propio titulo.
   */
  banner: {
    aspect: "aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9]",
    sizes: "(min-width: 1024px) 1024px, 100vw",
  },
} as const;

export function TripCover({
  tripId,
  imageUrl,
  variant,
  priority = false,
  className = "",
  children,
}: {
  tripId: string;
  imageUrl: string | null;
  variant: keyof typeof VARIANTS;
  /** El banner del detalle es el LCP de la pagina: siempre con priority. */
  priority?: boolean;
  className?: string;
  /** Superposiciones: badges, degrade, titulo. Van encima de la imagen. */
  children?: React.ReactNode;
}) {
  const { aspect, sizes } = VARIANTS[variant];

  return (
    <div className={`relative w-full overflow-hidden ${aspect} ${className}`}>
      <Image
        // Sin portada cae en el placeholder por hash del id, que es estable:
        // la tarjeta y el detalle del mismo viaje muestran la misma imagen.
        src={imageUrl ?? tripPlaceholderImage(tripId)}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${
          variant === "card" || variant === "strip"
            ? "transition-transform duration-1000 group-hover:scale-105"
            : ""
        }`}
      />
      {children}
    </div>
  );
}
