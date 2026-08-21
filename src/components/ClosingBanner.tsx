import Image from "next/image";

/**
 * Imagen full-bleed de cierre, entre los testimonios y la banda dorada.
 *
 * No lleva texto ni CTA: en el mockup es puro remate visual antes del footer.
 * Por eso el `alt` va vacio y marcada `aria-hidden` — anunciarla no le aporta
 * nada a quien navega con lector de pantalla.
 *
 * El alto va por `aspect-ratio` y no en pixeles: con alto fijo el recorte cambia
 * con el ancho del viewport. Es la misma regla de `TripCover` (docs/PORTADAS.md).
 */
export function ClosingBanner({ image }: { image: string }) {
  return (
    <div
      aria-hidden="true"
      // El borde superior se desvanece para que la imagen no aparezca como un
      // rectangulo pegado sobre el fondo. Abajo NO lleva mascara: ahi corta
      // contra la banda dorada, que en el mockup es un filo recto.
      //
      // El desvanecido va en PIXELES y no en porcentaje, y el bloque sube por
      // `-mt` exactamente esa misma medida. Los dos numeros son el mismo par a
      // proposito: asi el banner termina de aparecer justo en el borde donde
      // arranca, o sea encima del pie de "Voces de Luz" (que desde este arreglo
      // llega opaco hasta ahi), y los dos se cruzan sin dejar hueco.
      //
      // En porcentaje no se puede: el alto del bloque cambia con el ancho del
      // viewport (4/3 -> 21/9), asi que un 26% valia 76px en mobile y 178px en
      // escritorio, y ninguno de los dos coincidia con un margen fijo. El hueco
      // que quedaba mostraba el degrade del `body`, que a esta altura del
      // documento ya es casi negro: ese era el "slide en negro".
      //
      // La subida es menor que el padding inferior de "Voces de Luz" (80px en
      // mobile, 120px en escritorio) para no velar el pie de las tarjetas.
      className="relative -mt-16 aspect-[4/3] w-full overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0px,rgba(0,0,0,0.5)_28px,#000_64px)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0px,rgba(0,0,0,0.5)_28px,#000_64px)] sm:aspect-[16/9] md:-mt-24 md:[mask-image:linear-gradient(to_bottom,transparent_0px,rgba(0,0,0,0.5)_42px,#000_96px)] md:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0px,rgba(0,0,0,0.5)_42px,#000_96px)] lg:aspect-[21/9]"
    >
      <Image src={image} alt="" fill sizes="100vw" className="object-cover" />
    </div>
  );
}
