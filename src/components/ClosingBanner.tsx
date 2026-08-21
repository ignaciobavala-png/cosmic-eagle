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
      className="relative aspect-[4/3] w-full overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.5)_10%,#000_26%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.5)_10%,#000_26%)] sm:aspect-[16/9] lg:aspect-[21/9]"
    >
      <Image src={image} alt="" fill sizes="100vw" className="object-cover" />
    </div>
  );
}
