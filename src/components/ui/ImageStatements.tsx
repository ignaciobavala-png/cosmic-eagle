import Image from "next/image";

/**
 * Imagen full-bleed con cuatro frases sueltas alrededor de la figura central.
 *
 * En desktop las frases flotan sobre la imagen formando un rombo: la fila de
 * arriba se mete hacia el centro y la de abajo se abre a los bordes, asi caen en
 * el hueco que deja la figura y no encima de ella.
 *
 * En mobile no pueden quedar en las esquinas: la imagen pasa a ser un bloque en
 * el flujo y las frases se apilan debajo. Se resuelve con la MISMA marca, no con
 * dos copias — la imagen es `relative` en mobile y `absolute` recien en `md`. El
 * texto duplicado seria peor: lo leeria dos veces un lector de pantalla y lo
 * indexaria dos veces Google.
 *
 * Toma exactamente cuatro frases: es la composicion del mockup, no una grilla
 * generica.
 *
 * La sangria va como MARGEN sobre una caja de ancho fijo, no como padding: el
 * padding se descuenta del ancho del propio parrafo y las frases de la derecha
 * terminaban cayendo a una palabra por linea. Por lo mismo la caja lleva `w-` y
 * no `max-w-`, y `justify-self-start` para que la grilla no la estire.
 *
 * Ojo con las clases de posicion: van en una tabla por indice y NO como dos
 * condiciones encadenadas. Tailwind resuelve el conflicto entre dos utilidades
 * de la misma familia por el orden en la hoja generada, no por el orden en que
 * se escriben — el mismo problema documentado en `CtaLink`.
 */
const PLACEMENT = [
  "md:ml-[14%]", // 0 — izquierda, fila de arriba
  "md:ml-[26%]", // 1 — derecha, fila de arriba
  "md:ml-0", //     2 — izquierda, fila de abajo (contra el margen)
  "md:ml-[52%]", // 3 — derecha, fila de abajo (contra el margen)
] as const;

export function ImageStatements({
  image,
  imageAlt = "",
  statements,
  id,
}: {
  image: string;
  imageAlt?: string;
  statements: readonly [string, string, string, string];
  id?: string;
}) {
  return (
    <section id={id} className="relative w-full overflow-hidden">
      {/* La mascara desvanece el ultimo tramo para que la imagen no corte a filo
          recto contra la seccion siguiente, mismo criterio que `PageHero`. */}
      <div className="relative aspect-[16/10] w-full [mask-image:linear-gradient(to_bottom,#000_0%,#000_62%,rgba(0,0,0,0.6)_84%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_62%,rgba(0,0,0,0.6)_84%,transparent_100%)] md:absolute md:inset-0 md:aspect-auto">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Sin `max-w-narrative`: en el mockup las frases se apoyan en el margen de
          la pagina, no en el ancho narrativo. El tope evita que en pantallas muy
          anchas queden a kilometros de la figura. */}
      <div className="relative mx-auto grid w-full max-w-[100rem] grid-cols-1 gap-6 px-margin-mobile py-12 md:min-h-[44rem] md:grid-cols-2 md:content-center md:gap-y-28 md:px-margin-desktop md:py-section">
        {statements.map((text, i) => (
          <p
            key={text}
            className={`text-body-md text-on-surface [text-shadow:0_1px_14px_rgba(0,0,0,0.55)] md:w-[16rem] md:justify-self-start ${PLACEMENT[i]}`}
          >
            {text}
          </p>
        ))}
      </div>
    </section>
  );
}
