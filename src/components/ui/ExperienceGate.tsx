"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GateModal } from "./GateModal";

/**
 * Interpone el modal de sesión entre la cartelera y el detalle de una
 * experiencia, para quien no inició sesión (corrección del 02/09 de Julia: "si
 * un usuario toca una de estas experiencias sin estar logueado, debe abrirse la
 * tarjeta de solicitud de inicio de sesión").
 *
 * **No toca las tarjetas**: escucha el click en el contenedor y mira si salió
 * de un link a `/viajes/<id>`. Eso mantiene a `TripCard` como Server Component
 * y, sobre todo, deja la tarjeta como un `<a>` de verdad — se indexa, se abre
 * en pestaña nueva y, si el JS no cargó, sigue llevando al detalle, que es
 * público. El gate es una capa de invitación, no un candado: la página del
 * viaje no deja de ser accesible.
 *
 * La sesión se consulta desde el browser a propósito. Leerla en el servidor
 * exigiría `cookies()`, y eso volvería dinámicas la home y /viajes, que hoy se
 * sirven del CDN con ISR.
 */
export function ExperienceGate({ children }: { children: React.ReactNode }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    // `getSession` y no `getUser`: el segundo pega contra el Auth de Supabase
    // y hasta que contesta —cientos de ms— el gate deja pasar el click, o sea
    // que justo la primera visita, que es la que hay que interceptar, se va al
    // detalle sin ver el modal. `getSession` lee lo que ya está guardado en el
    // browser y contesta enseguida. No es una decisión de seguridad: la página
    // del viaje es pública igual, esto sólo decide si se muestra la invitación.
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session?.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(Boolean(session?.user))
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Va en la fase de CAPTURA, no en el burbujeo, y por eso corta la propagación.
   *
   * `next/link` maneja el click en su propio `onClick`: ahí llama a
   * `preventDefault()` y navega con el router. Escuchando el burbujeo se llega
   * tarde dos veces — el evento ya viene con `defaultPrevented` en true (o sea
   * que no se distingue de un click ya atendido) y la navegación del router ya
   * arrancó, así que prevenir el default no la frena. En captura el handler
   * corre antes que el del `<a>` y el Link no se entera.
   */
  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    // Mientras no se sabe si hay sesión, el link se deja pasar: es preferible
    // que alguien logueado no se coma un modal a destiempo.
    if (signedIn !== false) return;
    // Ctrl/cmd/shift+click y el botón del medio abren en otra pestaña o
    // ventana: eso es del browser y no se intercepta.
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const link = (e.target as HTMLElement).closest("a");
    const href = link?.getAttribute("href");
    if (!href || !/^\/viajes\/[^/]+$/.test(href)) return;

    e.preventDefault();
    e.stopPropagation();
    setTarget(href);
  }

  return (
    <div ref={box} onClickCapture={onClickCapture}>
      {children}
      <GateModal
        open={target !== null}
        onClose={() => setTarget(null)}
        next={target ?? undefined}
      />
    </div>
  );
}
