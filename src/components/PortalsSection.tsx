"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

/** Cada cuanto avanza solo. Suficiente para leer el ovalo antes del siguiente. */
const AUTOPLAY_MS = 5000;

const SPRING = { type: "spring", stiffness: 160, damping: 24 } as const;

/**
 * P8 — Carrusel de ovalos "Portales de transformacion". Tres imagenes
 * superpuestas: la activa al frente y nitida, las laterales atras, mas chicas y
 * atenuadas. Rota sola en circulo, y se puede adelantar a mano tocando un ovalo
 * o un punto.
 *
 * El contenido llega por props: es client component por el carrusel, asi que no
 * puede leer site-content por su cuenta.
 */
export function PortalsSection({
  title,
  subtitle,
  portals,
}: {
  title: string;
  subtitle: string;
  portals: { image: string; alt: string }[];
}) {
  // El indice anterior se guarda como estado y no en un ref: se lee durante el
  // render (para saber quien cambio de lado) y leer un ref ahi rompe la pureza
  // del render, ademas de que el lint lo rechaza.
  const [{ active, previous }, setIndex] = useState({ active: 1, previous: 1 });
  // Se frena mientras el visitante tiene el puntero encima o el foco adentro:
  // que la imagen que esta mirando se le vaya sola es lo que hace molesto a un
  // carrusel automatico.
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  // `active` va en las dependencias a proposito: cada avance (o click) reinicia
  // la espera, asi tocar un ovalo no queda seguido del salto automatico.
  useEffect(() => {
    if (paused || reduceMotion || portals.length < 2) return;

    const id = setTimeout(
      () =>
        setIndex((current) => ({
          active: (current.active + 1) % portals.length,
          previous: current.active,
        })),
      AUTOPLAY_MS
    );
    return () => clearTimeout(id);
  }, [active, paused, reduceMotion, portals.length]);

  function goTo(index: number) {
    setIndex((current) => ({ active: index, previous: current.active }));
  }

  /** Posicion del ovalo `i` cuando el activo es `center`: -1 izq, 0 medio, 1 der. */
  function offsetOf(i: number, center: number) {
    const raw = (i - center + portals.length) % portals.length;
    return raw === portals.length - 1 ? -1 : raw;
  }

  return (
    <section
      id="portales"
      // `overflow-x-clip`: los ovalos laterales se salen del ancho de contenido
      // a proposito. Sin el clip empujan el scroll horizontal de toda la pagina
      // en mobile. `clip` en vez de `hidden` para no crear un scroll container.
      className="mx-auto w-full max-w-narrative overflow-x-clip px-margin-mobile md:px-margin-desktop py-20 md:py-section"
    >
      <div className="text-center">
        <h2 className="font-display text-headline-md md:text-headline-lg text-primary">
          {title}
        </h2>
        <p className="mt-3 text-body-md text-on-surface-variant">{subtitle}</p>
      </div>

      <div
        className="relative mt-10 flex h-[20rem] items-center justify-center sm:mt-14 sm:h-[26rem] md:h-[32rem]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        // Capture porque el foco cae en los botones de adentro, no en el div.
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        {portals.map((portal, i) => {
          const offset = offsetOf(i, active);
          const isActive = offset === 0;
          // El que pasa de un extremo al otro al cerrar la vuelta: con tres
          // ovalos es el unico salto mayor a una posicion.
          const wrapped = Math.abs(offset - offsetOf(i, previous)) > 1;

          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={
                isActive ? `Portal ${i + 1}, activo` : `Ver portal ${i + 1}`
              }
              aria-current={isActive}
              animate={{
                x: `${offset * 62}%`,
                scale: isActive ? 1 : 0.82,
                // Al cambiar de lado no se desliza: se repone del otro extremo
                // y entra con un fundido, si no cruza la pantalla por detras
                // del ovalo del frente en cada vuelta.
                opacity: wrapped ? [0, 0.45] : isActive ? 1 : 0.45,
                zIndex: isActive ? 20 : 10,
              }}
              transition={
                wrapped
                  ? { x: { duration: 0 }, opacity: { duration: 0.5, ease: "easeOut" } }
                  : SPRING
              }
              className="absolute aspect-[3/4] h-full overflow-hidden rounded-[50%] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-fixed-dim"
              style={{ cursor: isActive ? "default" : "pointer" }}
            >
              <Image
                src={portal.image}
                alt={portal.alt}
                fill
                sizes="(min-width: 768px) 24rem, 15rem"
                className="object-cover"
              />
              {!isActive && <div className="absolute inset-0 bg-[#05102a]/50" />}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-10 flex items-center justify-center gap-3">
        {portals.map((portal, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Ir al portal ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active
                ? "w-8 bg-primary-fixed-dim"
                : "w-1.5 bg-on-surface-variant/40 hover:bg-on-surface-variant/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
