import { FourPointStar } from "./ClosingSection";

/**
 * Banda dorada que separa la imagen de cierre del footer.
 *
 * El fondo es un degrade vertical `#c8a34c -> #ecc97d -> #c8a34c` (muestreado del
 * slide de la disenadora, que en el centro aclara). Va en CSS y no como imagen:
 * el PNG original es un degrade plano de 138px de alto: en CSS pesa cero, no suma
 * una request y no se pixela al estirarse a un ancho mayor que el del slide.
 *
 * Las tres estrellas reusan `FourPointStar`, el mismo simbolo que ya usa P5.
 * Toda la banda es decorativa, asi que va marcada `aria-hidden`.
 */
export function GoldDivider() {
  return (
    <div
      aria-hidden="true"
      className="flex w-full items-center justify-center gap-4 bg-[linear-gradient(to_bottom,#c8a34c_0%,#ecc97d_52%,#c8a34c_100%)] py-6 md:gap-6 md:py-8"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#05125a]/45 md:h-11 md:w-11"
        >
          <FourPointStar className="h-3.5 w-3.5 !fill-[#05125a] md:h-4 md:w-4" />
        </span>
      ))}
    </div>
  );
}
