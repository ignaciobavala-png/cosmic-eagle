"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
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
  const card = useRef<HTMLDivElement>(null);

  /**
   * Lo que la spec marca como pendiente en su §9: el foco no se puede escapar
   * del modal mientras está abierto, y al cerrar vuelve a quien lo disparó.
   * El fondo además deja de scrollear — con el velo puesto, ver la página
   * moverse detrás se lee como que el modal no capturó nada.
   */
  useEffect(() => {
    if (!open) return;

    const returnTo = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // El primer foco va a la tarjeta y no al botón de cerrar: entrar con el
    // foco puesto en "cerrar" invita a cerrar, no a leer.
    card.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !card.current) return;
      const focusables = card.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === card.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      returnTo?.focus?.();
    };
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
            ref={card}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gate-title"
            initial={reduced ? false : { opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative w-full max-w-[27.5rem] rounded-[1.625rem] bg-[linear-gradient(150deg,#0079b3_0%,#0a1a6e_45%,#05125a_100%)] px-7 pb-8 pt-12 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)] min-[481px]:rounded-[2rem] min-[481px]:px-10 min-[481px]:pb-10 min-[481px]:pt-14"
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

            {/* El parrafo "Para explorar los detalles de esta experiencia
                cosmica..." salio a pedido de Julia (08/09): el titulo y los dos
                botones ya dicen todo lo que hay que hacer. Por eso los botones
                suben su margen, que antes lo daba el parrafo. */}
            <div className="mt-9 flex flex-col gap-4">
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

            {/* Julia (08/09): se va "Contacta soporte" y queda "¿Necesitas
                ayuda?" como el boton de contacto, subrayado sutil. El destino
                lo confirmo Ignacio el mismo dia: la casilla
                bookings@cosmiceaglejourney.com. Es un `mailto:` y no un
                `next/link` — no es una ruta del sitio. */}
            <a
              href={`mailto:${SOPORTE_EMAIL}`}
              className="mt-7 inline-block text-[13px] normal-case tracking-normal text-primary/75 underline decoration-primary/30 underline-offset-4 transition-colors duration-300 hover:text-primary hover:decoration-primary/70"
            >
              ¿Necesitas ayuda?
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * La casilla de contacto de la clienta (confirmada el 08/09). Es la unica del
 * sitio que se le ofrece a alguien sin sesion.
 */
const SOPORTE_EMAIL = "bookings@cosmiceaglejourney.com";

const GATE_BTN =
  "block rounded-full bg-[linear-gradient(135deg,#f9d78f,#b3964b)] px-5 py-4 font-display text-base font-bold text-[#05125a] transition-[box-shadow,transform,filter] duration-300 hover:-translate-y-px hover:brightness-[1.08] hover:shadow-[0_0_22px_rgba(249,215,143,0.75),0_0_44px_rgba(249,215,143,0.4)] active:-translate-y-px active:brightness-[1.08] active:shadow-[0_0_22px_rgba(249,215,143,0.75),0_0_44px_rgba(249,215,143,0.4)]";
