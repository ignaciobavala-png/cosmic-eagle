"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { IMAGES } from "@/lib/constants";

/**
 * Simbolos decorativos de /nosotros (`nos-symbol-1.png`/`nos-symbol-2.png`,
 * arte final de Julia). Son la fila de 3 (lateral + centro + lateral) que el
 * mockup `.nos-symbol-row` muestra entre pantallas:
 *
 * - Desktop: `position:absolute`, fila completa con los laterales abiertos
 *   hacia los bordes (max-width 1160px), centrada horizontalmente, y su `top`
 *   calculado en runtime para quedar justo a la mitad del espacio real entre
 *   el texto de arriba y el de abajo (`nosCenterSymbol()` del mockup).
 * - Mobile: flujo normal, solo el simbolo central, centrado entre los textos
 *   vía `margin-top`/`margin-bottom` también medidos en runtime.
 *
 * El centrado NO puede ser un valor fijo: el hueco entre los textos varía con
 * cuánto se envuelve el copy real en cada ancho, y un `top` clavado se rompe
 * en cuanto el copy cambie de longitud.
 *
 * Rotacion: continua, 30s por vuelta, sentido antihorario, infinita — es una
 * animacion de fondo independiente del reveal de aparicion. Se apaga con
 * `prefers-reduced-motion` desde CSS (`animate-nos-spin`).
 */

/** Clases de tamano del simbolo central. El mismo arte en tres tamanos. */
const CENTER_CLASS = {
  1: "h-[109px] w-[130px] md:h-[117px] md:w-[140px]",
  2: "h-[98px] w-[160px]",
} as const;

/** Clases de los laterales: solo desktop, tamano desktop. */
const SIDE_CLASS = {
  1: "hidden md:block h-[117px] w-[140px] animate-nos-spin",
  2: "hidden md:block h-[98px] w-[160px] animate-nos-spin",
} as const;

/** Clases de tamano del simbolo central. El mismo arte en tres tamanos. */export function SymbolRow({
  variant,
  id,
  aboveId,
  belowId,
  minGap = 32,
  maxGap,
  /** Umbral del observer propio del simbolo y retardo del fade de aparicion. */
  amount = 0.4,
  delay = 0,
}: {
  variant: 1 | 2;
  id: string;
  /** id del texto que queda arriba del simbolo (contra el que se centra). */
  aboveId: string;
  /** id del texto que queda abajo (suele vivir en la seccion siguiente). */
  belowId: string;
  minGap?: number;
  maxGap?: number;
  amount?: number;
  delay?: number;
}) {
  const src = variant === 1 ? IMAGES.nosSymbol1 : IMAGES.nosSymbol2;
  const alt = variant === 1 ? "Simbolo decorativo 1" : "Simbolo decorativo 2";
  const reduced = useReducedMotion();

  const rowRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rowRef, { amount, once: false });

  useEffect(() => {
    const node = rowRef.current;
    const aboveNode = document.getElementById(aboveId);
    const belowNode = document.getElementById(belowId);
    if (!node || !aboveNode || !belowNode) return;

    // Capturas no anulables para las closures de abajo: TypeScript pierde el
    // narrowing de `const` capturadas dentro de funciones anidadas.
    const symbol = node;
    const above = aboveNode;
    const below = belowNode;

    /**
     * El texto de arriba/abajo tiene su propio translateY de aparicion por
     * scroll, todavia sin activar cuando se mide (al cargar la pagina).
     * Medirlo tal cual daria una posicion corrida respecto de la final, asi
     * que se neutralizan transform y transition (sin transition el cambio
     * aplica al instante), se fuerza el reflow y se restaura todo.
     */
    function rectNoTransform(el: HTMLElement) {
      const prevTransform = el.style.transform;
      const prevTransition = el.style.transition;
      el.style.transition = "none";
      el.style.transform = "none";
      void el.offsetHeight;
      const r = el.getBoundingClientRect();
      el.style.transform = prevTransform;
      el.style.transition = prevTransition;
      void el.offsetHeight;
      return r;
    }

    function apply() {
      const base = minGap || 32;

      // Desktop: el simbolo esta fuera del flujo, asi que su `top` no empuja a
      // nadie y repartir el hueco real por la mitad funciona con una sola
      // medicion.
      if (window.getComputedStyle(symbol).position === "absolute") {
        const aboveBottom = rectNoTransform(above).bottom;
        const belowTop = rectNoTransform(below).top;
        const symbolRect = symbol.getBoundingClientRect();
        const totalGap = belowTop - aboveBottom;
        const half = Math.max(base, (totalGap - symbolRect.height) / 2);
        const parent = symbol.offsetParent as HTMLElement | null;
        const parentTop = parent ? parent.getBoundingClientRect().top : 0;
        symbol.style.top = `${Math.round(aboveBottom + half - parentTop)}px`;
        symbol.style.marginTop = "";
        symbol.style.marginBottom = "";
        return;
      }

      // Mobile: el simbolo esta en flujo normal dentro de una seccion centrada
      // (flex). Hay dos casos (con aire de sobra, o con la seccion desbordando
      // su alto minimo) que responden distinto a los cambios de margen, asi que
      // en vez de asumir una formula se mide la relacion real — lineal en ambos
      // casos — con 3 mediciones de prueba y se despeja el margin-top exacto
      // que iguala el espacio de arriba con el de abajo.
      symbol.style.top = "";
      const mt0 = base;
      const mb0 = base;
      symbol.style.marginTop = `${mt0}px`;
      symbol.style.marginBottom = `${mb0}px`;
      const gapBelow = () =>
        rectNoTransform(below).top - symbol.getBoundingClientRect().bottom;
      const g00 = gapBelow();
      const probeStep = 80;
      symbol.style.marginTop = `${mt0 + probeStep}px`;
      const g10 = gapBelow();
      symbol.style.marginTop = `${mt0}px`;
      symbol.style.marginBottom = `${mb0 + probeStep}px`;
      const g01 = gapBelow();
      symbol.style.marginBottom = `${mb0}px`;

      const a = (g10 - g00) / probeStep;
      const b = (g01 - g00) / probeStep;
      let target = mt0;
      if (Math.abs(1 - a) > 0.001) {
        target = (g00 - a * mt0) / (1 - a);
      }
      target = Math.max(base, target);
      let finalMb = mb0;

      if (maxGap && target > maxGap) {
        const V = maxGap;
        let mbNeeded =
          Math.abs(b) > 0.001
            ? mb0 + (V - g00 - a * (V - mt0)) / b
            : mb0;
        if (mbNeeded < 0) {
          mbNeeded = 0;
        }
        target = V;
        finalMb = mbNeeded;
      }

      symbol.style.marginTop = `${target}px`;
      symbol.style.marginBottom = `${finalMb}px`;
    }

    let raf1 = 0;
    let raf2 = 0;

    // El centrado depende del layout final (fuentes cargadas, CSS asentado,
    // imagenes presentes), asi que se re-aplica en varios momentos y no solo en
    // el `load`: en algun punto el efecto puede montarse con el CSS o las
    // fuentes todavia sin resolver y medir mal.
    const scheduleApply = () => {
      cancelAnimationFrame(raf1);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(apply);
      });
    };
    const timer = window.setTimeout(scheduleApply, 1500);
    scheduleApply();
    document.fonts?.ready.then(scheduleApply).catch(() => {});
    window.addEventListener("load", scheduleApply);
    window.addEventListener("resize", apply);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(timer);
      window.removeEventListener("load", scheduleApply);
      window.removeEventListener("resize", apply);
    };
  }, [aboveId, belowId, minGap, maxGap]);

  return (
    <motion.div
      id={id}
      ref={rowRef}
      aria-hidden="true"
      initial={false}
      animate={reduced || inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1, delay: reduced ? 0 : delay, ease: "easeOut" }}
      className="flex w-full items-center justify-center md:absolute md:left-1/2 md:z-[2] md:w-full md:max-w-[1160px] md:-translate-x-1/2 md:justify-between md:px-6"
    >
      {/* El row esta centrado por CSS; el `top`/margenes los fija el hook. El
          central se ve en los dos anchos; los laterales solo en desktop. */}
      <img src={src} alt="" className={SIDE_CLASS[variant]} />
      <img
        src={src}
        alt={alt}
        className={`block shrink-0 animate-nos-spin ${CENTER_CLASS[variant]}`}
      />
      <img src={src} alt="" className={SIDE_CLASS[variant]} />
    </motion.div>
  );
}
