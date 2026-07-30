"use client";

import { motion } from "framer-motion";
import { EBOOK_FEATURES } from "@/lib/constants";
import { Zap, Brain, Map } from "lucide-react";

const iconMap = {
  Zap,
  Brain,
  Map,
};

export function EbookSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="py-20 md:py-24 relative overflow-hidden bg-surface-container-lowest"
    >
      <div className="px-5 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-20 items-center">
          <div className="relative flex justify-center">
            <div className="absolute inset-0 bg-primary-container/20 blur-[100px] animate-pulse" />
            <div className="relative glass-card aspect-[3/4] max-w-sm mx-auto rounded-xl p-8 border border-primary-fixed-dim/30 flex flex-col items-center justify-center text-center shadow-2xl overflow-hidden">
              <span className="text-xs font-medium tracking-[0.05em] text-primary-fixed-dim mb-4">
                COSMIC EAGLE
              </span>
              <h3 className="font-display text-[40px] md:text-[64px] md:leading-[72px] md:tracking-[-0.02em] leading-none text-white">
                TECNOLOGÍA HUMANA
              </h3>
              <div className="w-24 h-px bg-primary-container my-8" />
              <p className="text-on-surface-variant">
                Un Mapa de Transformación y Evolución Consciente
              </p>
            </div>
          </div>

          <div>
            <span className="text-xs font-medium tracking-[0.05em] uppercase text-secondary block mb-4">
              Nuestro E-Book
            </span>
            <h2 className="font-display text-[32px] md:text-[40px] md:leading-[48px] font-medium text-primary-fixed-dim mb-6">
              Comprender la Energía Humana
            </h2>
            <ul className="space-y-6">
              {EBOOK_FEATURES.map((feature) => {
                const Icon = iconMap[feature.icon];
                return (
                  <li key={feature.title} className="flex gap-4 group">
                    <Icon className="text-secondary group-hover:scale-125 transition-transform shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-semibold tracking-[0.1em] text-white mb-1">
                        {feature.title}
                      </h5>
                      <p className="text-on-surface-variant">
                        {feature.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <button className="mt-10 w-full sm:w-auto px-10 py-4 bg-primary-container text-on-primary text-sm font-semibold tracking-[0.1em] rounded-full shadow-lg hover:shadow-primary-fixed-dim/20 transition-all duration-300">
              Comprar Ahora
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
