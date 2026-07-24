"use client";

import { motion } from "framer-motion";
import { IMAGES } from "@/lib/constants";

export function RetreatsSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="py-20 md:py-24 bg-surface-container-lowest/50"
    >
      <div className="px-5 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <span className="text-xs font-medium tracking-[0.05em] uppercase text-secondary block">
              Encuentra tu retiro
            </span>
            <h2 className="font-display text-[32px] md:text-[40px] md:leading-[48px] font-medium text-primary">
              Experiencias Próximas
            </h2>
          </div>
          <button className="px-6 py-2 border border-primary/30 rounded-full text-primary text-xs font-medium tracking-[0.05em] hover:bg-primary hover:text-on-primary transition-all">
            Ver todos los viajes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 group relative h-[400px] rounded-3xl overflow-hidden glass-card">
            <div className="absolute inset-0 bg-gradient-to-t from-void-black via-void-black/20 to-transparent z-10" />
            <img
              src={IMAGES.retreats}
              alt="Valle sagrado con neblina entre montañas"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
            />
            <div className="absolute bottom-0 left-0 p-6 z-20">
              <span className="bg-secondary/20 text-secondary border border-secondary/40 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest mb-4 inline-block backdrop-blur-md">
                Próximos Retiros
              </span>
              <h3 className="font-display text-2xl md:text-[32px] leading-[40px] text-white mb-2">
                Despertar en la Montaña Sagrada
              </h3>
              <p className="text-on-surface-variant max-w-md opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                Un viaje de 7 días de inmersión profunda y silencio consciente
                para reconectar con el origen.
              </p>
            </div>
          </div>

          <div className="md:col-span-4 group relative h-[400px] rounded-3xl overflow-hidden glass-card">
            <div className="absolute inset-0 bg-gradient-to-t from-void-black via-void-black/20 to-transparent z-10" />
            <img
              src={IMAGES.ceremony}
              alt="Elementos rituales con incienso y luz de vela"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
            />
            <div className="absolute bottom-0 left-0 p-6 z-20">
              <span className="bg-primary/20 text-primary border border-primary/40 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest mb-4 inline-block backdrop-blur-md">
                Ceremonias
              </span>
              <h3 className="font-display text-2xl md:text-[32px] leading-[40px] text-white">
                Equinoccio Galáctico
              </h3>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
