"use client";

import { motion } from "framer-motion";
import { IMAGES, CONTENT_CARDS } from "@/lib/constants";
import { ArrowRight } from "lucide-react";

const accentStyles = {
  primary: {
    overlay: "bg-primary-container/10",
    border: "hover:border-primary-fixed-dim/40",
    badge: "border-primary-fixed-dim/40",
  },
  secondary: {
    overlay: "bg-secondary/10",
    border: "border-secondary/20 hover:border-secondary/40",
    badge: "border-secondary/40",
  },
};

export function ContentSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="py-20 md:py-24 px-5 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 md:mb-20">
          <span className="text-xs font-medium tracking-[0.05em] uppercase text-secondary block mb-2">
            Explora más
          </span>
          <h2 className="font-display text-[40px] md:text-[64px] md:leading-[72px] md:tracking-[-0.02em] font-medium text-primary-fixed-dim">
            Contenidos
          </h2>
          <p className="max-w-xl mx-auto text-on-surface-variant mt-4">
            Programas, sesiones de audio, lecturas recomendadas, material de
            integración e investigación cósmica.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {CONTENT_CARDS.map((card) => {
            const accent = accentStyles[card.accent];
            return (
              <div
                key={card.title}
                className={`flex flex-col h-full glass-card p-6 rounded-[2rem] transition-all duration-300 group ${
                  card.offset ? "lg:-mt-8 lg:mb-8" : ""
                } ${accent.border}`}
              >
                <div className="h-64 rounded-2xl overflow-hidden mb-6 relative">
                  <img
                    src={IMAGES[card.image]}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div
                    className={`absolute inset-0 ${accent.overlay} mix-blend-overlay`}
                  />
                </div>
                <h4 className="font-display text-2xl leading-8 text-primary-fixed-dim mb-4">
                  {card.title}
                </h4>
                <p className="text-on-surface-variant flex-grow">
                  {card.description}
                </p>
                <button className="mt-6 flex items-center gap-2 text-primary-fixed-dim hover:text-secondary transition-colors text-sm font-semibold tracking-[0.1em]">
                  Ver Contenido
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
