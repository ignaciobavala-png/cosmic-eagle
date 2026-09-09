import { Reveal } from "./Reveal";

/**
 * Franja de fondo crema, a contramano del azul del resto del sitio.
 *
 * Sale del rediseño de Julia para /nosotros (`NOSOTROS.html`, `.nos-enfoque-*`):
 * es la primera vez que el sitio corta el fondo oscuro con una pantalla clara.
 * El color es el `--crema-claro` de su paleta, que ya existe como token
 * `primary` (`#fff6eb`); acá va literal porque es un fondo, no un color de
 * texto.
 *
 * Al invertir el fondo hay que invertir TODO el texto de adentro: el `body`
 * pinta gris claro por defecto y sobre crema no se lee. Por eso la seccion fija
 * el color base en azul oscuro y los hijos heredan.
 *
 * `full` (el default) le da el alto completo del viewport y centra el contenido,
 * que es como aparecen las pantallas de /nosotros en el mockup. En /viajes los
 * bloques son mas largos que una pantalla y llevan una banda de ancho completo
 * adentro, asi que van sin centrar: ahi se pasa `full={false}`.
 *
 * `flushBottom` saca el padding de abajo, para cuando el ultimo hijo es una
 * banda de ancho completo con fondo propio: sin esto queda una franja crema
 * colgando debajo de ella.
 *
 * **Ojo, esto NO se puede hacer con `className="pb-0"`.** Se intento asi y no
 * funcionaba: `py-24` emite `padding-block` y `pb-0` emite `padding-bottom`, y
 * entre dos utilidades de la misma especificidad decide el ORDEN DE LA HOJA
 * generada, no el orden en que se escriben las clases — ahi gana `py`. Quedaron
 * 96px de franja crema en las dos bandas de /viajes hasta que Ignacio la
 * reporto el 09/09. Es la misma trampa que documenta `CtaLink` con el
 * `display`. Por eso el padding se arma aca y nunca se pisa desde afuera.
 */
export function CreamSection({
  children,
  id,
  full = true,
  flushBottom = false,
  className = "",
  reveal,
}: {
  children: React.ReactNode;
  id?: string;
  full?: boolean;
  /** Sin padding abajo: el ultimo hijo es una banda con su propio fondo. */
  flushBottom?: boolean;
  className?: string;
  /**
   * Convierte la seccion en el elemento OBSERVADO del scroll reveal.
   *
   * No es lo mismo que envolver el contenido en un `Reveal` adentro: el umbral
   * se mide sobre lo que se observa, y la columna de texto es mas corta que la
   * seccion. Observando la columna, el bloque se apaga cuando todavia se lo ve
   * (la columna ya bajo del umbral pero su ultimo hijo sigue en pantalla).
   * Julia observa siempre la seccion.
   */
  reveal?: {
    amount?: number;
    once?: boolean;
    stagger?: number;
    delay?: number;
  };
}) {
  const padY = flushBottom ? "pt-20 md:pt-24" : "py-20 md:py-24";
  const classes = `w-full bg-[#fff6eb] px-margin-mobile ${padY} text-[#05125a] md:px-margin-desktop ${
    full ? "flex min-h-[100svh] items-center justify-center" : "block"
  } ${className}`;

  if (reveal) {
    return (
      <Reveal as="section" id={id} className={classes} {...reveal}>
        {children}
      </Reveal>
    );
  }

  return (
    <section id={id} className={classes}>
      {children}
    </section>
  );
}
