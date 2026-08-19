"use client";

import { useActionState, useState } from "react";
import { submitApplication, type ApplicationFormState } from "./actions";

const inputClass =
  "bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors";
const labelClass = "text-sm text-on-surface-variant tracking-[0.02em]";

function BoolQuestion({ name, label }: { name: string; label: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="flex flex-col gap-2 py-4 border-b border-outline-variant/40 last:border-0">
      <label className="flex items-center gap-3 text-on-surface cursor-pointer">
        <input
          type="checkbox"
          name={name}
          onChange={(e) => setChecked(e.target.checked)}
          className="w-4 h-4 accent-primary-fixed-dim"
        />
        {label}
      </label>
      {checked && (
        <textarea
          name={`${name}_detail`}
          placeholder="Contanos más..."
          rows={2}
          className={inputClass}
        />
      )}
    </div>
  );
}

/**
 * El filtro corto: lo llenan todos, primerizos y recurrentes.
 *
 * Las preguntas salen del formulario "Viajer@s" de Estela, que es el único
 * filtro corto relevado, pero el texto está redactado en neutro porque acá
 * también entra alguien que nunca ceremonió. Sofía describe un filtro de tres
 * preguntas con un encuadre distinto (adicciones, bipolaridad, depresión
 * severa) que no existe como formulario: si lo confirma, esto se reescribe.
 */
export function ScreeningForm({
  tripId,
  defaultEmail,
}: {
  tripId: string;
  defaultEmail?: string;
}) {
  const [state, formAction, pending] = useActionState<
    ApplicationFormState,
    FormData
  >(submitApplication.bind(null, tripId), { error: null });

  return (
    <form
      action={formAction}
      className="glass-card rounded-2xl p-6 md:p-8 flex flex-col gap-2 max-w-2xl"
    >
      <h2 className="font-display text-xl text-primary-fixed-dim mb-2">
        Datos personales
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Nombre completo</label>
          <input name="full_name" type="text" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Email</label>
          <input
            name="email"
            type="email"
            required
            defaultValue={defaultEmail}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Teléfono (opcional)</label>
          <input name="phone" type="tel" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>
            Ceremonias que hiciste con Estela
          </label>
          <input
            name="previous_ceremonies"
            type="number"
            min={0}
            defaultValue={0}
            required
            className={inputClass}
          />
          <span className="text-xs text-on-surface-variant">
            Si es tu primera vez, dejá el 0.
          </span>
        </div>
      </div>

      <h2 className="font-display text-xl text-primary-fixed-dim mt-4 mb-1">
        Antes de seguir
      </h2>
      <p className="text-xs text-on-surface-variant mb-2">
        Son unas pocas preguntas para saber cómo estás llegando. Si la solicitud
        avanza, más adelante te vamos a pedir un formulario de salud completo.
      </p>

      <BoolQuestion
        name="new_treatment"
        label="¿Estás haciendo algún tratamiento médico o psiquiátrico?"
      />
      <BoolQuestion
        name="stress_anxiety"
        label="¿Estás atravesando estrés, angustia o ansiedad con frecuencia?"
      />

      <div className="flex flex-col gap-1.5 py-4">
        <label className={labelClass}>
          Tema o intención que querés trabajar (opcional)
        </label>
        <textarea name="theme" rows={2} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5 py-2">
        <label className={labelClass}>
          Algo más que quieras compartir (opcional)
        </label>
        <textarea name="comment" rows={2} className={inputClass} />
      </div>

      {state.error && (
        <p className="text-error text-sm" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 bg-primary-container text-on-primary font-medium tracking-[0.05em] rounded-lg py-2.5 hover:bg-primary-fixed transition-colors disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar solicitud"}
      </button>
    </form>
  );
}
