import { Reveal } from "./Reveal";

/**
 * El crema de las franjas claras: `#f9d78f` —el oro del manual de marca— al 45%
 * sobre blanco. No es un hex inventado, sale de la paleta de la pagina 6.
 *
 * Reemplazo al `#fff6eb` de Julia el 10/09, despues de probarlo en /faqs: el
 * crema anterior "tiraba mucha luz" en pantalla grande. Contraste medido sobre
 * el nuevo: 14,62:1 con el azul de los titulos y 10,91:1 con el gris del
 * cuerpo, los dos muy arriba del 4,5:1 de AA.
 *
 * Van como clase completa y no como interpolacion de un hex: Tailwind escanea
 * el codigo fuente buscando literales, asi que `bg-[${hex}]` no genera regla.
 */
export const CREAM = "bg-[#fcedcd]";

/**
 * El mismo crema como hex suelto, para cuando hace falta interpolarlo en un
 * degrade y no alcanza con la clase (Tailwind no genera reglas a partir de
 * valores armados en runtime). Lo usa el `fadeTo` de `PageHero`.
 */
export const CREAM_HEX = "#fcedcd";

/**
 * Alias historico del crema profundo, que desde el 10/09 es el crema del
 * sistema: la prueba en /faqs se aprobo ("mucha luz" en el resto del sitio) y
 * el valor se mudo a `CREAM`. Se conserva el nombre para no romper imports.
 */
export const CREAM_DEEP = CREAM;

/**
 * La banda dorada: el degrade `#f9d78f -> #b3964b`, el mismo de la pildora y
 * del cierre de la home. Lo eligio Sofia el 11/09 sobre un comparador de ocho
 * fondos ("el crema no, que vaya mas hacia el golden") para la franja de
 * Tecnologia Humana, y desde el 15/09 se esta probando como fondo de franja en
 * /contenidos. Va por la prop `background` de `CreamSection`.
 *
 * Lo que arrastra un fondo dorado, medido: el cuerpo gris `#333` cae a 4,44:1
 * contra el punto mas oscuro del degrade —abajo del minimo— y pasa al azul
 * `#05125a` (5,95:1); el oro claro como filete da 1,00:1 y pasa al oro oscuro;
 * `on-primary-container` (`#755c21`), que es el color de texto chico sobre
 * crema, da 2,23:1 y tambien pasa al azul; y una pildora dorada se funde con el
 * fondo, asi que el boton va azul.
 */
export const GOLD = "bg-[linear-gradient(135deg,#f9d78f,#b3964b)]";

/**
 * El arranque del degrade dorado como hex suelto, para el `fadeTo` del
 * `PageHero`: el hero se funde con el BORDE SUPERIOR de la franja, que en un
 * degrade a 135 grados es el color de arriba a la izquierda.
 */
export const GOLD_HEX = "#f9d78f";

/**
 * El crema claro de Julia (`#fff6eb`, el token `primary`), que hasta el 10/09
 * era el fondo de las franjas.
 *
 * Pasó a ser el color de las SUPERFICIES que se apoyan sobre la franja —las
 * tarjetas y las fichas, que antes eran blancas—: con el fondo mas cargado, una
 * tarjeta blanca es el punto mas luminoso de la pagina y vuelve el
 * deslumbramiento por la ventana chica. Asi la tarjeta sigue siendo un escalon
 * mas clara que su fondo, sin blanco puro en ningun lado.
 */
export const CREAM_SURFACE = "bg-[#fff6eb]";

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
 * `background` cambia el color de la franja. Va como prop y NO como
 * `className` por lo mismo que el padding: dos utilidades de fondo de la misma
 * especificidad las resuelve el orden de la hoja generada, no el orden en que
 * se escriben las clases.
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
  background = CREAM,
  className = "",
  reveal,
}: {
  children: React.ReactNode;
  id?: string;
  full?: boolean;
  /** Sin padding abajo: el ultimo hijo es una banda con su propio fondo. */
  flushBottom?: boolean;
  /**
   * Color de la franja. El default es el crema del sistema y hoy no lo pisa
   * ninguna pagina: la prueba de /faqs se aprobo y el valor se mudo a `CREAM`.
   * La prop se conserva por si alguna franja necesita otro tono.
   */
  background?: string;
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
  const classes = `w-full ${background} px-margin-mobile ${padY} text-[#05125a] md:px-margin-desktop ${
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
