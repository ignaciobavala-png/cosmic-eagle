"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Modal "¿Quieres seguir explorando?" — el gate de sesión sobre el detalle de
 * una experiencia.
 *
 * Portado del paquete aprobado de Julia
 * (`docs/entregas/2026-09-02-julia/tarjetas/`), que trae el HTML, su
 * design-system y las notas de proceso. **Los valores de ahí ya están aprobados
 * por la clienta**: colores, tipografías, tiempos y los tres glows —dorado en
 * los botones, azul en la ✕, gris en el link de soporte— son intencionalmente
 * distintos entre sí y marcan tres jerarquías de acción, no son una
 * inconsistencia.
 *
 * `#0a1a6e` es el único valor que no es token del sitio: es el punto medio del
 * degradé de la tarjeta y sólo se usa acá.
 *
 * Los tres cierres son equivalentes y están los tres: la ✕, el click en el velo
 * (nunca dentro de la tarjeta) y Escape. El listener de Escape vive mientras el
 * modal está abierto, así no interfiere con otros usos de la tecla.
 */
export function GateModal({
  open,
  onClose,
  /** A dónde volver después de entrar. Viaja como `next` a /cuenta. */
  next,
}: {
  open: boolean;
  onClose: () => void;
  next?: string;
}) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const query = next ? `&next=${encodeURIComponent(next)}` : "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          // El click cierra sólo si cayó en el velo. Dentro de la tarjeta el
          // `target` nunca es este nodo, así que no hace falta parar la
          // propagación en cada hijo.
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-6"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="gate-title"
            initial={reduced ? false : { opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative w-full max-w-[27.5rem] rounded-[1.625rem] bg-[linear-gradient(160deg,#0079b3_0%,#0a1a6e_45%,#05125a_100%)] px-7 pb-8 pt-12 text-center shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:rounded-[2rem] sm:px-10 sm:pb-10 sm:pt-14"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center text-2xl leading-none text-[#0079b3] transition-[color,transform,text-shadow] duration-300 hover:scale-110 hover:text-[#4db8e8] hover:[text-shadow:0_0_14px_rgba(0,121,179,0.95),0_0_28px_rgba(0,121,179,0.65)] active:scale-110 active:text-[#4db8e8]"
            >
              <span aria-hidden="true">✕</span>
            </button>

            <h2
              id="gate-title"
              className="font-display text-[clamp(1.625rem,5vw,2.125rem)] font-bold leading-[1.25] text-primary-container"
            >
              ¿Quieres seguir explorando?
            </h2>

            <p className="mx-auto mt-4 max-w-[21.25rem] text-body-md text-primary-container/85">
              Para explorar los detalles de esta experiencia cósmica,
              necesitamos conocerte primero.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              <Link
                href={`/cuenta?${query.slice(1)}`}
                className={GATE_BTN}
                onClick={onClose}
              >
                Inicia sesión
              </Link>
              <Link
                href={`/cuenta?modo=registro${query}`}
                className={GATE_BTN}
                onClick={onClose}
              >
                Crear cuenta
              </Link>
            </div>

            {/* "Contacta soporte" queda SIN link: en el mockup apunta a `#` y el
                destino real (¿mail?, ¿página de contacto?) todavía no está
                definido. Mismo criterio que los links apagados del footer:
                antes que mandar a ningún lado, no linkear. */}
            <p className="mt-6 text-label-sm normal-case text-primary/75">
              ¿Necesitas ayuda? Contacta soporte
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const GATE_BTN =
  "block rounded-full bg-[linear-gradient(135deg,#f9d78f,#b3964b)] px-5 py-4 font-display text-base font-bold text-[#05125a] transition-[box-shadow,transform,filter] duration-300 hover:-translate-y-px hover:brightness-[1.08] hover:shadow-[0_0_22px_rgba(249,215,143,0.75),0_0_44px_rgba(249,215,143,0.4)] active:-translate-y-px active:brightness-[1.08] active:shadow-[0_0_22px_rgba(249,215,143,0.75),0_0_44px_rgba(249,215,143,0.4)]";
