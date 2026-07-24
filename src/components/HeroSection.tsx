"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen, ChevronsDown } from "lucide-react";

export function HeroSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1 }}
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-5"
    >
      <div className="relative z-10 max-w-4xl text-center flex flex-col items-center">
        <h1 className="font-display text-[32px] leading-[40px] md:text-[64px] md:leading-[72px] md:tracking-[-0.02em] font-medium text-primary text-shadow-glow mb-6">
          Sabiduría Cósmica para la <br className="hidden md:block" />
          Evolución Humana
        </h1>
        <p className="text-lg leading-7 text-on-surface-variant max-w-2xl mb-12">
          Cosmic Eagle explora el potencial más profundo de la conciencia
          humana. A través de experiencias inmersivas, enseñanzas y prácticas de
          integración, reconectamos con la inteligencia del alma.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button className="px-8 py-4 bg-primary text-on-primary text-sm font-semibold tracking-[0.1em] rounded-full hover:shadow-[0_0_20px_rgba(229,194,120,0.5)] transition-all duration-300 flex items-center justify-center gap-2 group">
            Explorar Viajes
            <ArrowUpRight
              size={18}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </button>
          <button className="px-8 py-4 border border-secondary text-secondary text-sm font-semibold tracking-[0.1em] rounded-full hover:bg-secondary/10 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2">
            Explorar Contenido
            <BookOpen size={18} />
          </button>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronsDown size={32} className="text-primary/50" />
      </div>
    </motion.section>
  );
}
