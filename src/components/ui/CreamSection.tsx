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
 */
export function CreamSection({
  children,
  id,
  full = true,
  className = "",
  reveal,
}: {
  children: React.ReactNode;
  id?: string;
  full?: boolean;
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
  const classes = `w-full bg-[#fff6eb] px-margin-mobile py-20 text-[#05125a] md:px-margin-desktop md:py-24 ${
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
