"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { PORTALS } from "@/lib/constants";

/**
 * P8 — Carrusel de ovalos "Portales de transformacion". Tres imagenes
 * superpuestas: la activa al frente y nitida, las laterales atras, mas chicas y
 * atenuadas. Sin autoplay: el spec pide que cada interaccion sea intencional.
 */
export function PortalsSection() {
  const [active, setActive] = useState(1);

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
          Portales de transformación
        </h2>
        <p className="mt-3 text-body-md text-on-surface-variant">
          para quienes buscan recordar su verdadero origen.
        </p>
      </div>

      <div className="relative mt-10 flex h-[20rem] items-center justify-center sm:mt-14 sm:h-[26rem] md:h-[32rem]">
        {PORTALS.map((portal, i) => {
          // -1 izquierda, 0 centro, 1 derecha
          const raw = (i - active + PORTALS.length) % PORTALS.length;
          const offset = raw === PORTALS.length - 1 ? -1 : raw;
          const isActive = offset === 0;

          return (
            <motion.button
              key={portal.image}
              type="button"
              onClick={() => setActive(i)}
              aria-label={
                isActive ? `Portal ${i + 1}, activo` : `Ver portal ${i + 1}`
              }
              aria-current={isActive}
              animate={{
                x: `${offset * 62}%`,
                scale: isActive ? 1 : 0.82,
                opacity: isActive ? 1 : 0.45,
                zIndex: isActive ? 20 : 10,
              }}
              transition={{ type: "spring", stiffness: 160, damping: 24 }}
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
        {PORTALS.map((portal, i) => (
          <button
            key={portal.image}
            type="button"
            onClick={() => setActive(i)}
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
