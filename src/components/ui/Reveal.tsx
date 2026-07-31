"use client";

import { motion } from "framer-motion";

/**
 * Scroll reveal del sitio, aislado en un wrapper cliente para que las secciones
 * que necesitan traer datos puedan seguir siendo Server Components.
 */
export function Reveal({
  children,
  className = "",
  duration = 0.8,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
