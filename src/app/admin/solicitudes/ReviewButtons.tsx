"use client";

import { useTransition } from "react";
import { reviewApplication } from "./actions";
import type { Enums } from "@/lib/supabase/types";

const OPTIONS: {
  status: Enums<"application_status">;
  label: string;
  /**
   * Lo que se pregunta antes de ejecutar. Recibe el nombre porque el riesgo es
   * justamente apretar el boton equivocado sobre la persona equivocada, y dice
   * QUE CORREO sale: los tres primeros escriben a la persona en el acto y eso
   * no se deshace (ver `reviewApplication` en actions.ts).
   */
  confirm: (nombre: string) => string;
  className: string;
}[] = [
  {
    status: "approved",
    label: "Aprobar",
    confirm: (nombre) =>
      `¿Aprobar la solicitud de ${nombre}?\n\nLe llega ahora mismo el correo de aprobación con los medios de pago, y se le habilitan los contenidos. El correo no se puede deshacer.`,
    className: "bg-secondary/20 text-secondary border-secondary/40 hover:bg-secondary/30",
  },
  {
    // Ni aprobar ni rechazar: el correo [2A] de Sofia. Va segundo a proposito
    // — es la salida natural de una solicitud con banderas de salud, y el
    // encuadre del filtro corto dice que eso no cierra la puerta.
    status: "needs_conversation",
    label: "Conversemos",
    confirm: (nombre) =>
      `¿Invitar a ${nombre} a conversar antes de decidir?\n\nLe llega ahora mismo el correo que le dice que quieren mirar algunas cosas juntas, y la solicitud queda abierta. El correo no se puede deshacer.`,
    className:
      "bg-tertiary-container/20 text-tertiary-container border-tertiary-container/40 hover:bg-tertiary-container/30",
  },
  {
    status: "rejected",
    label: "Rechazar",
    confirm: (nombre) =>
      `¿Rechazar la solicitud de ${nombre}?\n\nLe llega ahora mismo el correo avisándole que su solicitud no fue aprobada para este viaje. El correo no se puede deshacer.`,
    className: "bg-error/20 text-error border-error/40 hover:bg-error/30",
  },
  {
    status: "expired",
    label: "Marcar como expirada",
    // La unica de las cuatro que no escribe a nadie: es una invalidacion
    // administrativa. Se confirma igual —el click sigue cambiando el estado que
    // ve la persona en /cuenta— pero el texto lo dice, para que no se elija
    // creyendo que sirve para avisar algo.
    confirm: (nombre) =>
      `¿Marcar como expirada la solicitud de ${nombre}?\n\nNo se le manda ningún correo: no se entera salvo que entre al sitio, donde va a ver que su aprobación fue invalidada.`,
    className: "bg-outline-variant/30 text-on-surface-variant border-outline/40 hover:bg-outline-variant/50",
  },
];

export function ReviewButtons({
  id,
  currentStatus,
  fullName,
}: {
  id: string;
  currentStatus: Enums<"application_status">;
  fullName: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-3">
      {OPTIONS.filter((opt) => opt.status !== currentStatus).map((opt) => (
        <button
          key={opt.status}
          type="button"
          disabled={isPending}
          onClick={() => {
            // `confirm()` del browser y no un modal propio: es el patron que ya
            // usa el panel (ver DeleteTripButton), y lo que hace falta aca es
            // un freno, no una pantalla nueva.
            if (!confirm(opt.confirm(fullName))) return;
            startTransition(async () => {
              await reviewApplication(id, opt.status);
            });
          }}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium tracking-[0.02em] border transition-colors disabled:opacity-60 ${opt.className}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
