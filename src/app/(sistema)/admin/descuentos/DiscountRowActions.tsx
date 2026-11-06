"use client";

import { useTransition } from "react";
import { deleteDiscount, setDiscountActive } from "./actions";

export function DiscountRowActions({ id, active, code }: { id: string; active: boolean; code: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => setDiscountActive(id, !active))}
        className="text-xs text-on-surface-variant hover:text-on-surface disabled:opacity-40"
      >
        {active ? "Desactivar" : "Activar"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm(`¿Eliminar el código ${code}? Las solicitudes que ya lo usaron conservan su descuento.`)) {
            start(() => deleteDiscount(id));
          }
        }}
        className="text-xs text-error hover:underline disabled:opacity-40"
      >
        Eliminar
      </button>
    </div>
  );
}
