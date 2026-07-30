"use client";

import { useActionState, useState } from "react";
import { submitFirstTimeApplication, type ApplicationFormState } from "./actions";

const inputClass =
  "bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors";
const labelClass = "text-sm text-on-surface-variant tracking-[0.02em]";

function BoolQuestion({
  name,
  label,
  detailPlaceholder = "Contanos más...",
}: {
  name: string;
  label: string;
  detailPlaceholder?: string;
}) {
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
          placeholder={detailPlaceholder}
          rows={2}
          className={inputClass}
        />
      )}
    </div>
  );
}

export function FirstTimeForm({
  tripId,
  defaultEmail,
}: {
  tripId: string;
  defaultEmail?: string;
}) {
  const [state, formAction, pending] = useActionState<
    ApplicationFormState,
    FormData
  >(submitFirstTimeApplication.bind(null, tripId), { error: null });

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
          <label className={labelClass}>Edad</label>
          <input name="age" type="number" min={18} required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Altura</label>
          <input name="height" type="text" placeholder="1.70m" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Peso</label>
          <input name="weight" type="text" placeholder="65kg" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>País</label>
          <input name="country" type="text" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Ocupación</label>
          <input name="occupation" type="text" required className={inputClass} />
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
          <label className={labelClass}>Teléfono</label>
          <input name="phone" type="tel" required className={inputClass} />
        </div>
      </div>

      <h2 className="font-display text-xl text-primary-fixed-dim mt-4 mb-1">
        Salud y contención
      </h2>
      <p className="text-xs text-on-surface-variant mb-2">
        Esta información es confidencial y sólo la revisa el equipo médico y de
        contención. Cualquier respuesta afirmativa requiere revisión manual
        antes de aprobar tu solicitud.
      </p>

      <BoolQuestion
        name="health_condition"
        label="¿Tenés alguna condición de salud física o mental?"
      />
      <BoolQuestion
        name="trauma"
        label="¿Atravesaste algún evento traumático relevante?"
      />
      <BoolQuestion
        name="substance_use"
        label="¿Consumís medicación, alcohol u otras sustancias regularmente?"
      />
      <BoolQuestion
        name="stress_anxiety"
        label="¿Sufrís de estrés o ansiedad con frecuencia?"
      />
      <BoolQuestion
        name="allergies"
        label="¿Tenés alergias alimentarias o a medicamentos?"
      />
      <BoolQuestion
        name="spiritual_practice"
        label="¿Tenés una práctica espiritual o de meditación activa?"
      />
      <BoolQuestion
        name="first_time_plants"
        label="¿Es tu primera vez trabajando con plantas maestras?"
      />
      <BoolQuestion
        name="has_themes"
        label="¿Hay temas específicos que te gustaría trabajar en la ceremonia?"
      />
      <BoolQuestion
        name="fears"
        label="¿Tenés miedos particulares respecto a la experiencia?"
      />

      <div className="flex flex-col gap-1.5 py-4">
        <label className={labelClass}>Comentario adicional (opcional)</label>
        <textarea name="comment" rows={3} className={inputClass} />
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
