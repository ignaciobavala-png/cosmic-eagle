"use client";

import { useState, useTransition } from "react";
import { markPayment } from "./actions";
import type { Enums } from "@/lib/supabase/types";

const LABEL: Record<Enums<"payment_status">, string> = {
  pending: "Sin pagar",
  paid: "Pagado",
  waived: "Sin cargo",
};

export function PaymentControls({
  id,
  currentStatus,
  currentReference,
}: {
  id: string;
  currentStatus: Enums<"payment_status">;
  currentReference: string | null;
}) {
  const [reference, setReference] = useState(currentReference ?? "");
  const [isPending, startTransition] = useTransition();

  const options: Enums<"payment_status">[] = ["paid", "waived", "pending"];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-on-surface-variant">
        Estado actual: <span className="text-on-surface">{LABEL[currentStatus]}</span>
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-on-surface-variant tracking-[0.02em]">
          Referencia (transferencia, fecha, lo que te sirva)
        </span>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        {options
          .filter((opt) => opt !== currentStatus)
          .map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await markPayment(id, opt, reference);
                })
              }
              className="px-4 py-2.5 rounded-lg text-sm font-medium tracking-[0.02em] border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-60"
            >
              Marcar como {LABEL[opt].toLowerCase()}
            </button>
          ))}
      </div>
    </div>
  );
}
