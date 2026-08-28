"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";

/**
 * Progreso del scroll a lo largo de una sección alta: 0 cuando su techo toca el
 * techo de la pantalla, 1 cuando su piso toca el piso. Es el mismo tramo que
 * describe `useScroll({ target, offset: ["start start", "end end"] })`.
 *
 * ## Por qué no se usa `useScroll`
 *
 * Esto **no** es reinventar la rueda: `useScroll` estaba roto en los dos
 * bloques de scroll largo del sitio (`ScrollStory` en la home y `StickyStory`
 * en /nosotros), y el efecto se veía al revés a partir de la mitad del
 * recorrido.
 *
 * Framer Motion 12 delega las animaciones ligadas al scroll al motor nativo del
 * browser (`ViewTimeline` + WAAPI) cuando el valor viene de `useScroll` y la
 * propiedad es acelerable, como `opacity`. Para traducir
 * `offset: ["start start", "end end"]` usa el rango **`contain`**, que es el
 * tramo en que el elemento entra ENTERO en la pantalla. Estos bloques miden
 * 260vh y 360vh: nunca entran enteros, así que ese rango es degenerado y lo que
 * pinta el compositor no tiene nada que ver con el progreso real.
 *
 * Medido en Chrome (390x844 y 1440x900, mismo resultado): `scrollYProgress`
 * daba 0 → 1 perfecto y el `progress` del efecto también, pero la opacidad que
 * terminaba en el DOM subía hasta ~0.75 del recorrido y después **volvía sola a
 * su valor inicial** — las palabras clave se desvanecían justo cuando tenían
 * que quedar solas en pantalla.
 *
 * Un `MotionValue` propio, actualizado desde un listener de scroll, no tiene
 * timeline asociada, así que Framer no puede delegarlo y escribe los estilos
 * desde JS. Se siguen animando sólo `opacity` y `transform`, que es lo que
 * importaba para el costo. **Si algún día se vuelve a `useScroll` acá, hay que
 * volver a verificar esto en el browser**, no alcanza con que compile.
 *
 * @param enabled `false` (por ejemplo con "reducir movimiento") no engancha
 *   ningún listener; el valor queda quieto.
 */
export function useSectionProgress(enabled = true): {
  ref: RefObject<HTMLElement | null>;
  progress: MotionValue<number>;
} {
  const ref = useRef<HTMLElement>(null);
  const progress = useMotionValue(0);

  useEffect(() => {
    if (!enabled) return;

    let pending = 0;

    const measure = () => {
      pending = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      // Si la sección no supera a la pantalla no hay recorrido que medir: se
      // deja el bloque en su estado final en vez de dividir por cero.
      progress.set(span <= 0 ? 1 : clamp(-rect.top / span));
    };

    // El scroll dispara mucho más seguido que los frames; se coalescen en uno.
    const onScroll = () => {
      if (pending) return;
      pending = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (pending) cancelAnimationFrame(pending);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [enabled, progress]);

  return { ref, progress };
}

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
