"use client";

import { useEffect, useId, useState } from "react";
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
 *
 * `openOnHash` lo deja abrirse desde otra parte de la página sin compartir
 * estado: el disparador es un `<a href="#lo-que-sea">` común, así que el salto
 * lo hace el browser (y sigue funcionando sin JS) y acá sólo se despliega el
 * panel. Es lo que usa el botón "Explorar experiencias" del relato de la home.
 *
 * **`tone` no es decoración**: el botón nació en `/viajes`, dentro de una
 * `CreamSection`, y por eso su texto es el azul `#05125a`. En la home el mismo
 * botón cae sobre el azul `#020c41` de la sección del calendario, donde ese
 * texto es invisible — azul sobre azul. Cualquier uso nuevo sobre fondo oscuro
 * tiene que pasar `tone="dark"`.
 */
export function Collapsible({
  label,
  children,
  defaultOpen = false,
  openOnHash,
  tone = "light",
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** Se abre solo cuando la URL apunta a este id (sin `#`). */
  openOnHash?: string;
  /** `light` = sobre crema (/viajes). `dark` = sobre el azul de la home. */
  tone?: "light" | "dark";
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!openOnHash) return;
    const sync = () => {
      if (window.location.hash === `#${openOnHash}`) setOpen(true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [openOnHash]);

  const toneClasses =
    tone === "dark"
      ? "border-primary-container text-primary-container hover:bg-primary-container hover:text-[#05125a]"
      : "border-[#b3964b] text-[#05125a] hover:bg-[#05125a] hover:text-white";

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`inline-flex items-center gap-2.5 rounded-full border-[1.5px] px-8 py-3.5 font-display text-body-md font-bold transition-colors duration-300 ${toneClasses}`}
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
