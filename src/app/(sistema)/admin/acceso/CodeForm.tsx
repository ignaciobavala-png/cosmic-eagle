"use client";

import { useActionState } from "react";
import { GRANTABLE_LEVELS } from "@/lib/content-access";
import { createAccessCode, type AccessFormState } from "./actions";

const inputClass =
  "bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors";
const labelClass = "text-sm text-on-surface-variant tracking-[0.02em]";

/**
 * Alta de un codigo. El codigo lo escribe ella (no se genera al azar) para que
 * pueda ser algo decible por WhatsApp: "TULUM-2026".
 */
export function CodeForm({
  trips,
}: {
  trips: { id: string; title: string }[];
}) {
  const [state, formAction, pending] = useActionState<AccessFormState, FormData>(
    createAccessCode,
    { error: null }
  );

  return (
    <form action={formAction} className="glass-card rounded-2xl p-5 md:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="code" className={labelClass}>
            Código
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            placeholder="TULUM-2026"
            className={`${inputClass} uppercase`}
          />
          <p className="text-xs text-on-surface-variant">
            Se guarda en mayúsculas. Quien lo escriba puede tipearlo como quiera.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="label" className={labelClass}>
            Para qué es
          </label>
          <input
            id="label"
            name="label"
            type="text"
            placeholder="Viaje a Tulum, noviembre"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="trip_id" className={labelClass}>
            Experiencia (opcional)
          </label>
          <select id="trip_id" name="trip_id" className={inputClass}>
            <option value="">Ninguna en particular</option>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.title}
              </option>
            ))}
          </select>
          <p className="text-xs text-on-surface-variant">
            Es sólo para acordarte de dónde salió. No exige estar inscripto a esa
            experiencia.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="level" className={labelClass}>
            Qué habilita
          </label>
          <select
            id="level"
            name="level"
            defaultValue="programa"
            className={inputClass}
          >
            {GRANTABLE_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label} — {level.hint}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="max_uses" className={labelClass}>
            Cuántas personas pueden usarlo
          </label>
          <input
            id="max_uses"
            name="max_uses"
            type="number"
            min={1}
            placeholder="Sin tope"
            className={inputClass}
          />
          <p className="text-xs text-on-surface-variant">
            Vacío = sin tope. Poné el tamaño del grupo: es lo que limita el daño
            si el código circula de más.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="expires_at" className={labelClass}>
            Vence el
          </label>
          <input
            id="expires_at"
            name="expires_at"
            type="date"
            className={inputClass}
          />
          <p className="text-xs text-on-surface-variant">
            Vacío = no vence. El vencimiento del código también vence el acceso
            de quien lo canjeó.
          </p>
        </div>
      </div>

      {state.error && <p className="mt-4 text-sm text-error">{state.error}</p>}
      {state.ok && (
        <p className="mt-4 text-sm text-primary-fixed-dim">{state.ok}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-lg bg-primary-container px-6 py-2.5 text-sm font-medium tracking-[0.05em] text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-40"
      >
        {pending ? "Creando…" : "Crear código"}
      </button>
    </form>
  );
}
