"use client";

import { useActionState, useEffect, useRef } from "react";
import { createDiscount, type DiscountFormState } from "./actions";

const input =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary-fixed-dim focus:outline-none";
const label = "text-sm font-medium text-on-surface";

export function DiscountForm({
  people,
  trips,
}: {
  people: { id: string; label: string }[];
  trips: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState<DiscountFormState, FormData>(
    createDiscount,
    { error: null }
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="glass-card grid gap-4 rounded-2xl p-5 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="code" className={label}>Código</label>
        <input id="code" name="code" required maxLength={30} placeholder="BIENVENIDA10" className={`${input} uppercase`} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="kind" className={label}>Tipo de descuento</label>
        <select id="kind" name="kind" defaultValue="percent" className={input}>
          <option value="percent">Porcentaje (%)</option>
          <option value="amount">Monto fijo (en la moneda de la experiencia)</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="value" className={label}>Valor</label>
        <input id="value" name="value" type="number" min={0} step="0.01" required className={input} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="user_id" className={label}>Asignar a una persona</label>
        <select id="user_id" name="user_id" defaultValue="" className={input}>
          <option value="">Cualquiera que tenga el código</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <p className="text-xs text-on-surface-variant">
          Si eliges a alguien, sólo esa persona puede usarlo y al postular se le ofrece solo.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="trip_id" className={label}>Válido para</label>
        <select id="trip_id" name="trip_id" defaultValue="" className={input}>
          <option value="">Todas las experiencias</option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="max_uses" className={label}>Usos máximos</label>
        <input id="max_uses" name="max_uses" type="number" min={1} step={1} placeholder="Sin límite" className={input} />
        <p className="text-xs text-on-surface-variant">Vacío = sin límite (1 si está asignado a una persona).</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="expires_on" className={label}>Vence el</label>
        <input id="expires_on" name="expires_on" type="date" className={input} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="note" className={label}>Nota interna</label>
        <input id="note" name="note" maxLength={200} placeholder="Para qué es" className={input} />
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary-container px-5 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-40"
        >
          {pending ? "Creando…" : "Crear código"}
        </button>
        {state.error && <p role="alert" className="text-sm text-error">{state.error}</p>}
        {state.ok && <p role="status" className="text-sm text-secondary">Código creado.</p>}
      </div>
    </form>
  );
}
