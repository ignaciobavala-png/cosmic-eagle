"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

/**
 * La imagen llega por props y no de `IMAGES`: es editable desde
 * /admin/multimedia (slot `home.about.image`). El componente es cliente por
 * Framer Motion, asi que no puede leer site-content por su cuenta — la home se
 * la pasa, igual que a `PortalsSection`.
 */
export function AboutSection({ image }: { image: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="py-20 md:py-24 px-margin-mobile md:px-margin-desktop max-w-narrative mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 space-y-6">
          <span className="text-xs font-medium tracking-[0.05em] uppercase text-secondary block">
            Sobre Cosmic Eagle
          </span>
          <h2 className="font-display text-[32px] md:text-[40px] md:leading-[48px] font-medium text-primary-fixed-dim">
            Un Camino de Evolución Consciente
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              Cosmic Eagle está dedicado a explorar la naturaleza más profunda
              del ser humano: cuerpo, mente, energía, conciencia y alma.
            </p>
            <p>
              A través de retiros, experiencias inmersivas y contenido
              educativo, compartimos conocimientos sobre los procesos internos
              que permiten a las personas evolucionar, sanar y reconectarse con
              su verdadera esencia.
            </p>
            <p>
              Este trabajo reúne sabiduría ancestral, conocimientos modernos
              sobre la mente y un profundo respeto por la dimensión sagrada de
              la vida.
            </p>
          </div>
          <button className="group mt-6 flex items-center gap-4 text-primary-fixed-dim text-sm font-semibold tracking-[0.1em] hover:text-secondary transition-colors">
            <span className="h-px w-12 bg-primary-container group-hover:bg-secondary transition-all group-hover:w-16" />
            Leer Más
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>

        <div className="order-1 lg:order-2 relative aspect-square group">
          <div className="absolute inset-0 bg-nebula-glow rounded-3xl blur-3xl group-hover:blur-[60px] transition-all duration-700" />
          <div className="relative w-full h-full rounded-3xl overflow-hidden glass-card p-2 border border-primary-fixed-dim/20">
            {/* El wrapper existe para que `fill` respete el `p-2` del marco: un
                absoluto se posiciona contra la caja de padding, asi que sin el
                la foto tapa el borde de vidrio. */}
            <div className="relative h-full w-full overflow-hidden rounded-2xl">
              <Image
                src={image}
                alt="Siluetas humanas conectadas con energía cósmica"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
