"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";

/**
 * Motor de scroll reveal del sitio.
 *
 * Replica el estándar de los HTML de Julia (ver `spec_verificacion_sitio.html`,
 * 27/08). Los cuatro parámetros que importan y que antes estaban clavados:
 *
 * - **Umbral real**, no margen. Ella dispara cuando el 22–40% del elemento está
 *   en pantalla (`threshold` del IntersectionObserver); antes usábamos
 *   `margin:"-100px"`, que dispara apenas asoma el borde superior. En una
 *   sección de pantalla completa eso arrancaba casi media pantalla antes.
 * - **Cascada**: título → línea → cuerpo → botón, a 150ms de distancia. Es lo
 *   que más se nota: sin esto el bloque entero entra como una pieza.
 * - **Distancia y duración por bloque**: 24px/0.9s es el estándar, pero las
 *   frases sobre imagen usan 30px/1s y el manifiesto de la home 40px/1.6s.
 * - **Reversibilidad**: en `/nosotros` y `/viajes` la animación se deshace al
 *   volver hacia arriba (`once={false}`); en la home es de una sola vez. Los
 *   dos criterios conviven en su propio código; está preguntado cuál gana.
 *
 * ## El resguardo de carga
 *
 * `armed` no es paranoia: es el bug que Julia documentó en los tres archivos. El
 * IntersectionObserver evalúa la intersección **en el instante en que se llama a
 * `observe()`**, y si en ese momento las fuentes web o las imágenes todavía no
 * asentaron el layout, puede creer que la sección ya está en pantalla y disparar
 * todo apenas carga la página. Con `once` eso es irreversible: la sección queda
 * revelada para siempre.
 *
 * Por eso no se empieza a observar hasta `load` + dos `requestAnimationFrame`.
 * Y la espera tiene que gatear el **observador**, no el resultado: se le pasa a
 * `useInView` una ref vacía hasta que está armado, así la primera medición
 * ocurre con el layout ya asentado. Gatear solo la salida no serviría — con
 * `once`, `useInView` ya habría quedado en `true` desde el montaje.
 */

const EASE = [0, 0, 0.2, 1] as const; // ease-out de CSS

function enterVariants(y: number, duration: number, delay: number): Variants {
  return {
    hidden: { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration, delay, ease: EASE },
    },
  };
}

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Fracción del elemento que tiene que estar en pantalla para disparar. */
  amount?: number;
  /** `false` deshace la animación al volver hacia arriba. */
  once?: boolean;
  /** Desplazamiento inicial en px. */
  y?: number;
  duration?: number;
  delay?: number;
  /**
   * Segundos entre hijos. Al pasarlo, el contenedor deja de animarse solo y pasa
   * a orquestar a sus `RevealItem`.
   */
  stagger?: number;
  id?: string;
  /**
   * `section` para que el observador mida la seccion entera y no la columna de
   * texto de adentro. **No es cosmetico**: en una seccion de pantalla completa
   * con el contenido centrado, un umbral de 0.3 sobre el bloque interno dispara
   * mucho mas tarde que el mismo 0.3 sobre la seccion. Julia observa siempre el
   * contenedor de pantalla completa.
   */
  as?: "div" | "section";
};

export function Reveal({
  children,
  className = "",
  amount = 0.25,
  once = true,
  y = 24,
  duration = 0.9,
  delay = 0,
  stagger,
  id,
  as = "div",
}: RevealProps) {
  const reduced = useReducedMotion();
  const nodeRef = useRef<HTMLDivElement>(null);
  // Ref que nunca apunta a nada: es la que recibe `useInView` mientras el
  // layout no terminó de asentarse, para que no mida antes de tiempo.
  const idleRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    let first = 0;
    let second = 0;

    const arm = () => {
      first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => setArmed(true));
      });
    };

    if (document.readyState === "complete") {
      arm();
    } else {
      window.addEventListener("load", arm);
    }

    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      window.removeEventListener("load", arm);
    };
  }, []);

  const inView = useInView(armed ? nodeRef : idleRef, { amount, once });

  // Con "reducir movimiento" no hay entrada ni observador: el contenido está.
  if (reduced) {
    return as === "section" ? (
      <section id={id} className={className}>
        {children}
      </section>
    ) : (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  const orchestrating = stagger !== undefined;
  const Tag = as === "section" ? motion.section : motion.div;

  return (
    <Tag
      id={id}
      ref={nodeRef}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={
        orchestrating
          ? {
              hidden: {},
              visible: {
                transition: { staggerChildren: stagger, delayChildren: delay },
              },
            }
          : enterVariants(y, duration, delay)
      }
    >
      {children}
    </Tag>
  );
}

/**
 * Un hijo de un `Reveal` con `stagger`. Hereda el estado del padre, así que no
 * lleva observador propio.
 *
 * `delay` acá es **además** del que le toca por la cascada del padre. Sirve para
 * los bloques donde Julia no usa un escalón parejo — en el panel Sesiones/Viajes
 * de la home, por ejemplo, el título y la línea decorativa entran los dos en 0ms
 * y recién el subtítulo va a 150ms.
 */
export function RevealItem({
  children,
  className = "",
  y = 24,
  duration = 0.9,
  delay = 0,
  scaleFrom,
  as = "div",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
  duration?: number;
  delay?: number;
  /** Escala inicial. La imagen de "Tecnología del Alma" entra desde 0.98. */
  scaleFrom?: number;
  /** `span` para los items que viven dentro de un titulo o un parrafo. */
  as?: "div" | "span";
  /** Ancla para scroll o para las mediciones de centrado de /nosotros. */
  id?: string;
}) {
  const reduced = useReducedMotion();
  const Tag = as === "span" ? motion.span : motion.div;

  if (reduced) {
    return as === "span" ? (
      <span id={id} className={className}>{children}</span>
    ) : (
      <div id={id} className={className}>{children}</div>
    );
  }

  // El `delay` sólo se emite si es distinto de cero. **No es un detalle de
  // estilo**: cuando el padre orquesta con `staggerChildren`, Framer implementa
  // el escalón como el `delay` de cada hijo, y un `delay: 0` escrito acá lo pisa
  // — los hijos entran todos juntos. Los bloques que llevan retardos a mano
  // (el panel Sesiones/Viajes, Tecnología del Alma) siguen igual: ahí el padre
  // va con `stagger={0}` y el escalón es justamente ese `delay`.
  const variants: Variants = {
    hidden: { opacity: 0, y, ...(scaleFrom !== undefined && { scale: scaleFrom }) },
    visible: {
      opacity: 1,
      y: 0,
      ...(scaleFrom !== undefined && { scale: 1 }),
      transition: { duration, ease: EASE, ...(delay ? { delay } : {}) },
    },
  };

  return (
    <Tag id={id} className={className} variants={variants}>
      {children}
    </Tag>
  );
}

/**
 * La línea decorativa dorada que crece debajo de los títulos.
 *
 * Anima `scaleX` y no `width`: el ancho lo resuelve el layout en cada frame, la
 * escala la resuelve el compositor. Con `origin-left` se ve igual.
 *
 * **Ojo**: crece en la home (70px) y en `/nosotros` (64px), pero en `/viajes` y
 * en "Salud y Seguridad" es una barra **estática** — así está en el código
 * aprobado y la spec lo marca como intencional. Ahí va un `<div>` común.
 */
export function RevealLine({
  className = "",
  duration = 1.2,
  delay = 0,
}: {
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div aria-hidden="true" className={className} />;

  return (
    <motion.div
      aria-hidden="true"
      className={`origin-left ${className}`}
      variants={{
        hidden: { scaleX: 0 },
        visible: { scaleX: 1, transition: { duration, delay, ease: EASE } },
      }}
    />
  );
}
