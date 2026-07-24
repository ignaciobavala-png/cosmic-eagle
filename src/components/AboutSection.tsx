"use client";

import { motion } from "framer-motion";
import { IMAGES } from "@/lib/constants";
import { ArrowRight } from "lucide-react";

export function AboutSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="py-20 md:py-24 px-5 max-w-7xl mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 space-y-6">
          <span className="text-xs font-medium tracking-[0.05em] uppercase text-secondary block">
            Sobre Cosmic Eagle
          </span>
          <h2 className="font-display text-[32px] md:text-[40px] md:leading-[48px] font-medium text-primary">
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
          <button className="group mt-6 flex items-center gap-4 text-primary text-sm font-semibold tracking-[0.1em] hover:text-secondary transition-colors">
            <span className="h-px w-12 bg-primary group-hover:bg-secondary transition-all group-hover:w-16" />
            Leer Más
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>

        <div className="order-1 lg:order-2 relative aspect-square group">
          <div className="absolute inset-0 bg-nebula-glow rounded-3xl blur-3xl group-hover:blur-[60px] transition-all duration-700" />
          <div className="relative w-full h-full rounded-3xl overflow-hidden glass-card p-2 border border-primary/20">
            <img
              src={IMAGES.about}
              alt="Siluetas humanas conectadas con energía cósmica"
              className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
