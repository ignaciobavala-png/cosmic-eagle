import { RevealLine } from "./Reveal";

/**
 * El filete debajo del título de una sección.
 *
 * Unifica los quince que hasta el 16/09 eran una barra sólida de 64px
 * (`h-px w-16`): quedaban cortos al lado de títulos de 300 y 400px, y no eran
 * el filete que el sitio adoptó el 12/09 a pedido de Sofía —1px con los
 * extremos desvanecidos, que se percibe todavía más delgado que un 1px pleno—.
 *
 * Las dos cosas que decide el componente:
 *
 * - **El largo lo pone el título, no un número.** El filete es `w-full`, así
 *   que mide lo que mida su contenedor: el patrón es envolver el `h2` y el
 *   filete en un `w-fit`, que se encoge al ancho del texto. En un título
 *   partido a mano con `<br>` eso es el renglón más largo; en uno que envuelve
 *   solo, el ancho de la columna.
 * - **Hacia dónde desvanece depende de la alineación.** Centrado va simétrico,
 *   como el de "Nuestro propósito". Alineado a la izquierda **arranca pleno**:
 *   con el degradé simétrico el filete empieza en transparente y se despega de
 *   la primera letra del título, que es justo lo que tiene que subrayar.
 *
 * `grow` conserva la distinción que ya estaba y que la spec marca como
 * intencional: en la home y en /nosotros el filete CRECE con el scroll
 * (`RevealLine`), y en /viajes y "Salud y Seguridad" es una barra estática.
 */
const TONE = {
  /** `#f9d78f`, el oro claro. El filete de casi todas las franjas crema. */
  gold: {
    left: "bg-[linear-gradient(to_right,#f9d78f_0%,#f9d78f_55%,transparent_100%)]",
    center:
      "bg-[linear-gradient(to_right,transparent_0%,#f9d78f_50%,transparent_100%)]",
  },
  /** `#b3964b`, el oro de relleno. Va donde el claro no se ve. */
  goldDark: {
    left: "bg-[linear-gradient(to_right,#b3964b_0%,#b3964b_55%,transparent_100%)]",
    center:
      "bg-[linear-gradient(to_right,transparent_0%,#b3964b_50%,transparent_100%)]",
  },
  /** `#755c21`, el oro oscuro de texto chico sobre claro. */
  goldDeep: {
    left: "bg-[linear-gradient(to_right,#755c21_0%,#755c21_55%,transparent_100%)]",
    center:
      "bg-[linear-gradient(to_right,transparent_0%,#755c21_50%,transparent_100%)]",
  },
} as const;

export function TitleRule({
  tone = "gold",
  align = "left",
  grow = false,
  className = "",
}: {
  tone?: keyof typeof TONE;
  align?: "left" | "center";
  /** `true` lo hace crecer con el scroll; `false` es una barra estática. */
  grow?: boolean;
  /** Sólo los márgenes del sitio donde va. El resto lo pone el componente. */
  className?: string;
}) {
  const classes = `h-px w-full ${TONE[tone][align]} ${className}`;

  return grow ? (
    <RevealLine className={classes} />
  ) : (
    <div aria-hidden="true" className={classes} />
  );
}
