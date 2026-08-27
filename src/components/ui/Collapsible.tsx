"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Botón que despliega un panel debajo, del rediseño de /viajes (`.exp-cta-btn`
 * + `.exp-cartelera-wrap`): el calendario de cada tipo de experiencia no se ve
 * hasta que se lo pide.
 *
 * El contenido se renderiza SIEMPRE en el HTML, aunque esté colapsado: son las
 * tarjetas de los viajes, y si sólo existieran al abrir el panel no estarían en
 * la página para Google ni para un lector de pantalla. Lo que se anima es la
 * altura del contenedor.
 *
 * Los hijos llegan como `children` desde un Server Component, así que las
 * tarjetas siguen armándose en el servidor con los datos de Supabase: el
 * `"use client"` queda acotado a este envoltorio (mismo patrón que `Reveal`).
 */
export function Collapsible({
  label,
  children,
  defaultOpen = false,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const reduced = useReducedMotion();

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-[#b3964b] px-8 py-3.5 font-display text-body-md font-bold text-[#05125a] transition-colors duration-300 hover:bg-[#05125a] hover:text-white"
      >
        {label}
        <span
          aria-hidden="true"
          className={`inline-block transition-transform duration-300 ${open ? "rotate-90" : ""}`}
        >
          →
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="panel"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pt-11">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
