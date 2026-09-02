"use client";

import { useTransition } from "react";
import { reviewApplication } from "./actions";
import type { Enums } from "@/lib/supabase/types";

const OPTIONS: { status: Enums<"application_status">; label: string; className: string }[] = [
  {
    status: "approved",
    label: "Aprobar",
    className: "bg-secondary/20 text-secondary border-secondary/40 hover:bg-secondary/30",
  },
  {
    // Ni aprobar ni rechazar: el correo [2A] de Sofia. Va segundo a proposito
    // — es la salida natural de una solicitud con banderas de salud, y el
    // encuadre del filtro corto dice que eso no cierra la puerta.
    status: "needs_conversation",
    label: "Conversemos",
    className:
      "bg-tertiary-container/20 text-tertiary-container border-tertiary-container/40 hover:bg-tertiary-container/30",
  },
  {
    status: "rejected",
    label: "Rechazar",
    className: "bg-error/20 text-error border-error/40 hover:bg-error/30",
  },
  {
    status: "expired",
    label: "Marcar como expirada",
    className: "bg-outline-variant/30 text-on-surface-variant border-outline/40 hover:bg-outline-variant/50",
  },
];

export function ReviewButtons({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: Enums<"application_status">;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-3">
      {OPTIONS.filter((opt) => opt.status !== currentStatus).map((opt) => (
        <button
          key={opt.status}
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await reviewApplication(id, opt.status);
            })
          }
          className={`px-4 py-2.5 rounded-lg text-sm font-medium tracking-[0.02em] border transition-colors disabled:opacity-60 ${opt.className}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
