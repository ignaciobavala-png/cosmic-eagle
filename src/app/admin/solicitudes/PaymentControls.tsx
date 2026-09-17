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
  // Arranca en lo EFECTIVAMENTE recibido y no en un monto sugerido (antes caia
  // a la sena o al precio). El sugerido se guardaba solo si nadie lo miraba: un
  // click en "Marcar como pagado" dejaba la solicitud en `paid` con el monto de
  // la sena, y el correo [3C] salia diciendo "tu pago esta completo" con saldo
  // pendiente. Lo que el campo dice tiene que ser lo que Estela vio en el
  // comprobante, no una adivinanza.
  const [amount, setAmount] = useState(String(amountPaid ?? 0));
  const [isPending, startTransition] = useTransition();

  const monto = Number(amount || 0);
  const saldo = price - monto;
  /** Lo que ya esta guardado en la base, para el renglon "Estado actual". */
  const saldoGuardado = price - amountPaid;

  const options: Enums<"payment_status">[] = depositAmount
    ? ["deposit_paid", "paid", "waived", "pending"]
    : ["paid", "waived", "pending"];

  /**
   * El aviso de que el monto no cierra con el estado que se va a marcar. No
   * bloquea —puede haber un descuento acordado, y la pantalla del postulante ya
   * dice "si acordaste otro monto, vale lo que acordaron"— pero tiene que verse
   * ANTES de apretar, porque despues del click el correo ya salio.
   *
   * `pending` y `waived` no entran: el server action les pone `amount_paid` en
   * cero a proposito, asi que el numero del campo no llega a guardarse.
   */
  function avisoPara(opt: Enums<"payment_status">): string | null {
    if (opt === "pending" || opt === "waived") return null;
    // El estado actual tambien se puede guardar (el boton de abajo), asi que
    // tiene aviso propio: ahi no se marca nada nuevo, queda como esta.
    const accion =
      opt === currentStatus
        ? `Si guardás el monto, el estado queda en «${LABEL[opt]}»`
        : `Vas a marcar «${LABEL[opt]}»`;
    if (opt === "paid" && saldo > 0) {
      return `${accion} con ${formatAmount(monto)} de ${formatAmount(price)}: le queda un saldo de ${formatAmount(saldo)}, y a la persona se le dice que su pago está completo.`;
    }
    if (opt === "deposit_paid" && monto <= 0) {
      return `${accion} sin ningún monto recibido: revisá el número antes de guardar.`;
    }
    if (opt === "deposit_paid" && saldo <= 0) {
      return `${accion} con el total ya cubierto (${formatAmount(monto)} de ${formatAmount(price)}). Si pagó todo, va «Marcar como pagado».`;
    }
    return null;
  }

  // Se muestran todos los que apliquen —cada uno nombra su boton— y no sólo el
  // primero: si hay dos caminos posibles, Estela tiene que ver el riesgo de los
  // dos antes de elegir.
  const avisos = options
    .map((opt) => ({ opt, texto: avisoPara(opt) }))
    .filter((a): a is { opt: Enums<"payment_status">; texto: string } => !!a.texto);

  function guardar(opt: Enums<"payment_status">) {
    startTransition(async () => {
      await markPayment(id, opt, reference, monto);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-on-surface-variant">
        Estado actual: <span className="text-on-surface">{LABEL[currentStatus]}</span>
        {currentStatus !== "pending" && currentStatus !== "waived" && (
          <>
            {" "}
            · recibido {formatAmount(amountPaid)} de {formatAmount(price)}
            {/* El saldo guardado se dice igual que el previsualizado, con las
                mismas palabras: si la pantalla lo nombra de dos maneras, el
                numero se lee como si fueran dos cosas distintas. */}
            {saldoGuardado > 0
              ? ` · queda un saldo de ${formatAmount(saldoGuardado)}`
              : " · sin saldo pendiente"}
          </>
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
            {saldo > 0
              ? ` · quedaría un saldo de ${formatAmount(saldo)}`
              : " · sin saldo pendiente"}
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

      {avisos.map((aviso) => (
        <p
          key={aviso.opt}
          className="rounded-lg border border-error/40 bg-error/[0.08] px-4 py-3 text-sm text-error"
        >
          {aviso.texto}
        </p>
      ))}

      <div className="flex flex-wrap gap-3">
        {options
          .filter((opt) => opt !== currentStatus)
          .map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={isPending}
              onClick={() => guardar(opt)}
              className="px-4 py-2.5 rounded-lg text-sm font-medium tracking-[0.02em] border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-60"
            >
              {ACCION[opt]}
            </button>
          ))}

        {/* El estado actual no tiene boton en la lista de arriba (cambiar a lo
            que ya es no es una accion), y sin este no habia forma de corregir el
            monto: un pago parcial que no llega al total, o un numero mal
            tecleado, quedaban sin poder registrarse en ningun lado. Reenvia el
            MISMO estado a `markPayment`, que solo manda correo cuando
            `application.payment_status !== paymentStatus`: guardar asi no le
            remanda nada a la persona. */}
        {currentStatus !== "pending" && currentStatus !== "waived" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => guardar(currentStatus)}
            className="px-4 py-2.5 rounded-lg text-sm font-medium tracking-[0.02em] border border-primary-fixed-dim/40 text-primary-fixed-dim hover:bg-primary-fixed-dim/10 transition-colors disabled:opacity-60"
          >
            Guardar el monto sin cambiar el estado
          </button>
        )}
      </div>
    </div>
  );
}
