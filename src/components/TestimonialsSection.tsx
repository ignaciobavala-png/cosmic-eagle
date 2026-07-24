"use client";

import { motion } from "framer-motion";
import { TESTIMONIALS } from "@/lib/constants";
import { Star } from "lucide-react";

export function TestimonialsSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="py-20 md:py-24 px-5"
    >
      <div className="max-w-7xl mx-auto text-center">
        <span className="text-xs font-medium tracking-[0.05em] uppercase text-secondary block mb-2">
          Clientes
        </span>
        <h2 className="font-display text-[32px] md:text-[40px] md:leading-[48px] font-medium text-primary mb-16">
          Lo que dicen Nuestros Viajeros
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className={`glass-card p-8 rounded-3xl text-left relative ${
                i % 2 === 0
                  ? "border-b-4 border-b-primary/50"
                  : "border-b-4 border-b-secondary/50"
              }`}
            >
              <div className="flex text-primary mb-6 gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-white italic mb-8 leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-variant border border-primary/20 flex items-center justify-center text-primary font-bold">
                  {t.initial}
                </div>
                <span className="text-xs font-medium tracking-[0.05em] text-on-surface-variant">
                  {t.name} ({t.location})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
