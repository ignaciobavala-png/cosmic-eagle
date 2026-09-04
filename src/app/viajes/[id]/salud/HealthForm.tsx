"use client";

import { useActionState } from "react";
import {
  NumberInput,
  YesNoQuestion,
  inputClass,
  labelClass,
} from "@/components/forms/fields";
import { submitHealthForm, type HealthFormState } from "./actions";

export function HealthForm({
  tripId,
  applicationId,
}: {
  tripId: string;
  applicationId: string;
}) {
  const [state, formAction, pending] = useActionState<HealthFormState, FormData>(
    submitHealthForm.bind(null, tripId, applicationId),
    { error: null }
  );

  return (
    <form
      action={formAction}
      className="glass-card rounded-2xl p-6 md:p-8 flex flex-col gap-2 max-w-2xl"
    >
      <h2 className="font-display text-xl text-primary-fixed-dim mb-2">
        Tus datos
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Edad</label>
          <NumberInput name="age" required />
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
          <label className={labelClass}>País de origen</label>
          <input name="country" type="text" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Ocupación</label>
          <input name="occupation" type="text" required className={inputClass} />
        </div>
      </div>

      <h2 className="font-display text-xl text-primary-fixed-dim mt-4 mb-1">
        Salud y contención
      </h2>
      <p className="text-xs text-on-surface-variant mb-2">
        Esta información es confidencial y sólo la revisa el equipo médico y de
        contención. Sirve para preparar la ceremonia y acompañarte mejor.
      </p>

      <YesNoQuestion
        name="health_condition"
        label="¿Tienes alguna condición de salud física o mental?"
      />
      <YesNoQuestion
        name="trauma"
        label="¿Atravesaste algún evento traumático relevante?"
      />
      <YesNoQuestion
        name="substance_use"
        label="¿Consumís medicación, alcohol u otras sustancias regularmente?"
      />
      <YesNoQuestion
        name="stress_anxiety"
        label="¿Sufrís de estrés o ansiedad con frecuencia?"
      />
      <YesNoQuestion
        name="allergies"
        label="¿Tienes alergias alimentarias o a medicamentos?"
      />
      <YesNoQuestion
        name="spiritual_practice"
        label="¿Tienes una práctica espiritual o de meditación activa?"
      />
      <YesNoQuestion
        name="first_time_plants"
        detailName="plants_detail"
        label="¿Es tu primera vez trabajando con plantas maestras?"
      />
      <YesNoQuestion
        name="has_themes"
        detailName="themes_detail"
        label="¿Hay temas específicos que te gustaría trabajar en la ceremonia?"
      />
      <YesNoQuestion
        name="fears"
        label="¿Tienes miedos particulares respecto a la experiencia?"
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
        {pending ? "Enviando..." : "Enviar formulario"}
      </button>
    </form>
  );
}
