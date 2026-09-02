"use client";

import { useState, useTransition } from "react";
import { markPayment } from "./actions";
import { formatAmount } from "@/lib/format";
import type { Enums } from "@/lib/supabase/types";

const LABEL: Record<Enums<"payment_status">, string> = {
  pending: "Sin pagar",
  deposit_paid: "Seña pagada",
  paid: "Pagado",
  waived: "Sin cargo",
};

const ACCION: Record<Enums<"payment_status">, string> = {
  pending: "Marcar como sin pagar",
  deposit_paid: "Registrar la seña",
  paid: "Marcar como pagado",
  waived: "Marcar como sin cargo",
};

/**
 * El pago lo registra Estela a mano mirando el comprobante: no hay pasarela
 * (ver docs/PAGOS.md). Desde el 02/09 registra ademas *cuanto* entro, porque
 * Sofia confirmo que se ofrecen las dos opciones —sena o total— y el saldo hay
 * que poder decirlo.
 *
 * El monto es ACUMULADO, no "lo de este pago": es la respuesta a "cuanto lleva
 * pagado esta persona", que es la pregunta que se hace quien mira la pantalla.
 * Asi el saldo es una resta y no depende de sumar un historial.
 */
export function PaymentControls({
  id,
  currentStatus,
  currentReference,
  amountPaid,
  price,
  depositAmount,
}: {
  id: string;
  currentStatus: Enums<"payment_status">;
  currentReference: string | null;
  amountPaid: number;
  price: number;
  /** `null` cuando el viaje no ofrece sena: se paga completo. */
  depositAmount: number | null;
}) {
  const [reference, setReference] = useState(currentReference ?? "");
  const [amount, setAmount] = useState(
    String(amountPaid || depositAmount || price || 0)
  );
  const [isPending, startTransition] = useTransition();

  const saldo = price - Number(amount || 0);

  const options: Enums<"payment_status">[] = depositAmount
    ? ["deposit_paid", "paid", "waived", "pending"]
    : ["paid", "waived", "pending"];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-on-surface-variant">
        Estado actual: <span className="text-on-surface">{LABEL[currentStatus]}</span>
        {currentStatus !== "pending" && currentStatus !== "waived" && (
          <> · recibido {formatAmount(amountPaid)} de {formatAmount(price)}</>
        )}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-on-surface-variant tracking-[0.02em]">
            Monto recibido en total (USD)
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors"
          />
          <span className="text-xs text-on-surface-variant">
            {depositAmount
              ? `Seña ${formatAmount(depositAmount)} · total ${formatAmount(price)}`
              : `Total ${formatAmount(price)}`}
            {saldo > 0 && ` · quedarían ${formatAmount(saldo)}`}
          </span>
        </label>

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
      </div>

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
                  await markPayment(id, opt, reference, Number(amount || 0));
                })
              }
              className="px-4 py-2.5 rounded-lg text-sm font-medium tracking-[0.02em] border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-60"
            >
              {ACCION[opt]}
            </button>
          ))}
      </div>
    </div>
  );
}
