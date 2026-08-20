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
 * Ojo con las clases de posicion: van en una tabla por indice y NO como dos
 * condiciones encadenadas. Tailwind resuelve el conflicto entre
 * `justify-self-center` y `justify-self-end` por el orden en la hoja generada, no
 * por el orden en que se escriben — el mismo problema documentado en `CtaLink`.
 */
const PLACEMENT = [
  "md:justify-self-end md:text-right", // 0 — izquierda, fila de arriba (hacia el centro)
  "md:justify-self-start md:text-left", // 1 — derecha, fila de arriba (hacia el centro)
  "md:justify-self-start md:text-left", // 2 — izquierda, fila de abajo (al borde)
  "md:justify-self-end md:text-right", // 3 — derecha, fila de abajo (al borde)
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
      <div className="relative aspect-[16/10] w-full md:absolute md:inset-0 md:aspect-auto">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-narrative grid-cols-1 gap-6 px-margin-mobile py-12 md:min-h-[44rem] md:grid-cols-2 md:content-center md:gap-x-8 md:gap-y-32 md:px-margin-desktop md:py-section">
        {statements.map((text, i) => (
          <p
            key={text}
            className={`text-body-md text-on-surface [text-shadow:0_1px_14px_rgba(0,0,0,0.55)] md:max-w-[17rem] ${PLACEMENT[i]}`}
          >
            {text}
          </p>
        ))}
      </div>
    </section>
  );
}
