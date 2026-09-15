"use client";

import { useEffect, useState } from "react";

import { Reveal, RevealItem, RevealLine } from "./Reveal";

/**
 * Secuencia de palabras encadenadas (`Liberar · Recordar · Reconectar ·
 * Encarnar`), del rediseño de /nosotros.
 *
 * **El eslabón es un filete que se dibuja, no una flecha.** Hasta el 15/09 eran
 * tres `→`: a Sofía no le gustaban ("algo más sutil que una flecha"), y en una
 * página que no tiene ningún otro signo de interfaz la flecha era justamente lo
 * que desentonaba. El filete se lleva la esencia sin el signo: es el mismo que
 * va debajo de cada título de /nosotros, y la SECUENCIA no se pierde porque el
 * filete entra dibujándose de izquierda a derecha — la dirección la da el
 * movimiento y no una punta.
 *
 * Va en `#755c21`, que es el mismo tono que tenía la flecha. Los dos oros más
 * claros no sirven acá: desde el 15/09 esta pantalla tiene el fondo dorado, y
 * sobre él `#f9d78f` y `#b3964b` quedan oro sobre oro (1,20:1 y 1,61:1 medidos
 * en el punto donde cae el filete, o sea que desaparecen). `#755c21` da 3,58:1
 * ahí y no baja de 2,23:1 ni en el extremo más oscuro del degradé: se ve sin
 * gritar, que es lo que se pidió. El azul del texto daría 9,55:1 y convertiría
 * al eslabón en un elemento fuerte.
 *
 * Las palabras entran alternando de abajo y de arriba (±36px), escalonadas. Los
 * siete elementos —cuatro palabras y tres filetes— llevan retardos de 0.1s a
 * 1.2s, que es lo que Julia escribe a mano por `nth-child`: de ahí salen el
 * `delay` de 0.1 y el escalón de 0.183 del contenedor.
 *
 * Por eso van los siete como hijos DIRECTOS del contenedor y no agrupados de a
 * pares: el escalón de Framer Motion se reparte entre los hijos directos, y
 * anidarlos daría dos tiempos en vez de siete.
 *
 * En mobile la fila pasa a columna y el filete se pone vertical, igual que
 * hacía la flecha en el mockup. No rota: se dibuja hacia ABAJO, con `axis="y"`
 * de `RevealLine`. Una rotación de 90° sobre un filete con `origin-left` lo
 * haría crecer desde el costado equivocado.
 *
 * **Y ahí la secuencia va más lenta**, que es la corrección del 02/09 de Julia
 * ("en mobile se desarrolla muy rápido, y eso no es bueno para la experiencia").
 * Sus retardos son los mismos en las dos versiones, pero en columna los siete
 * elementos caen uno debajo del otro y entran casi juntos mientras la persona
 * sigue bajando; en fila el ojo los recorre de a uno. Se estira el escalón y la
 * duración, no el diseño.
 *
 * `once={false}`: la secuencia se re-arma al volver hacia arriba, que es el
 * estándar reversible de /nosotros y /viajes.
 */
export function WordSequence({ words }: { words: readonly string[] }) {
  // Se arranca en desktop y se corrige en el efecto. No hay parpadeo: el
  // observador de `Reveal` no empieza a mirar hasta `load` + doble rAF, o sea
  // bastante despues de que esto ya se acomodo.
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <Reveal
      amount={0.4}
      once={false}
      stagger={narrow ? 0.33 : 0.183}
      delay={0.1}
      className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-4"
    >
      {words.flatMap((word, i) => [
        ...(i > 0
          ? [
              <RevealLine
                key={`link-${word}`}
                axis={narrow ? "y" : "x"}
                duration={narrow ? 1.1 : 0.9}
                className={
                  narrow ? "h-8 w-px bg-[#755c21]" : "h-px w-10 bg-[#755c21]"
                }
              />,
            ]
          : []),
        <RevealItem
          key={word}
          as="span"
          y={i % 2 === 0 ? 36 : -36}
          // El `duration` del padre no llega a los hijos cuando orquesta una
          // cascada: cada item lleva el suyo.
          duration={narrow ? 1.1 : 0.9}
          className="font-display text-[clamp(1.5rem,4.2vw,2.875rem)] font-bold text-[#05125a]"
        >
          {word}
        </RevealItem>,
      ])}
    </Reveal>
  );
}
