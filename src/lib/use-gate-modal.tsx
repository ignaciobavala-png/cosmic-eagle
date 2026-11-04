"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { GateModal } from "@/components/ui/GateModal";

const noop = () => () => {};

/**
 * El aviso de "esta sección es para quien tiene cuenta", para los lugares
 * donde un invitado toca algo cerrado (navbar, footer, "Explorar
 * experiencias").
 *
 * Hasta el 04/11/2026 esos accesos aparecían apagados y no hacían nada: sin
 * una palabra que explicara por qué, un visitante lo leía como un link roto.
 * Ahora se pueden apretar y abren el modal de sesión, que dice qué falta.
 *
 * **El modal sale por un portal al `body`**, no donde se usa el hook: el navbar
 * y sus desplegables tienen transformaciones y blur, y un `position: fixed`
 * adentro de uno de esos queda atrapado en la caja del padre en vez de cubrir
 * la pantalla. Además el desplegable se cierra al sacar el mouse, y el modal no
 * puede morir con él.
 *
 * `mounted` va por `useSyncExternalStore` y no por un `useEffect`: es la forma
 * de saber que ya hay `document` sin un render de más ni un aviso de hidratación.
 */
export function useGateModal() {
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState<string | null>(null);
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false
  );

  const openGate = useCallback((href?: string) => {
    setNext(href ?? null);
    setOpen(true);
  }, []);

  const gateModal = mounted
    ? createPortal(
        <GateModal
          open={open}
          onClose={() => setOpen(false)}
          next={next ?? undefined}
        />,
        document.body
      )
    : null;

  return { openGate, gateModal };
}
