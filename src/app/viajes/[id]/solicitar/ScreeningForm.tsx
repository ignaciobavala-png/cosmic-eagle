"use client";

import { useActionState } from "react";
import {
  NumberInput,
  YesNoQuestion,
  inputClass,
  labelClass,
} from "@/components/forms/fields";
import { submitApplication, type ApplicationFormState } from "./actions";

/**
 * El filtro corto: lo llenan todos, primerizos y recurrentes.
 *
 * El encuadre y las tres preguntas son el texto que mandó Sofía el 19/08/2026,
 * literal. No reescribirlo sin consultar: es copy de la clienta.
 *
 * Ojo con lo que dice ese texto: "nada de lo que nos cuentes cierra la puerta
 * de entrada". El encuadre es INFORMATIVO, no excluyente — ninguna respuesta
 * rechaza sola, todas las solicitudes las lee Estela.
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
      <div className="flex flex-col gap-3 text-on-surface-variant text-sm leading-relaxed border-b border-outline-variant/40 pb-6 mb-2">
        <p className="text-on-surface">
          Qué bueno que quieras ser parte de este espacio. Te compartimos
          algunas cosas antes de avanzar.
        </p>
        <p>
          Este es un espacio orientado a la expansión de conciencia, el
          desarrollo humano y los procesos evolutivos.
        </p>
        <p>
          No está enfocado en el tratamiento directo de adicciones al alcohol o
          a otras sustancias, trastorno bipolar, depresión severa, enfermedades
          crónicas o autoinmunes, ni reemplaza un tratamiento médico,
          psicológico o psiquiátrico.
        </p>
        <p>
          En estos casos, la participación deberá ser evaluada previamente y,
          cuando corresponda, podrá requerir el acompañamiento de un profesional
          o terapeuta especializado que pueda sostener el proceso de manera
          adecuada y segura.
        </p>
      </div>

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
          <label className={labelClass}>País de residencia</label>
          <input
            name="residence_country"
            type="text"
            required
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>
            Ceremonias que hiciste con Estela
          </label>
          <NumberInput name="previous_ceremonies" defaultValue={0} required />
          <span className="text-xs text-on-surface-variant">
            Si es tu primera vez, deja el 0.
          </span>
        </div>
      </div>

      <h2 className="font-display text-xl text-primary-fixed-dim mt-4 mb-1">
        Por eso nos gustaría que nos cuentes
      </h2>

      <YesNoQuestion
        name="serious_illness"
        detailRequired
        label="¿Tienes o has tenido alguna enfermedad grave?"
        hint="Cardíaca, neurológica, epilepsia, hepática, oncológica, autoinmune u otra."
        placeholder="Contanos cuál y cuándo."
      />
      <YesNoQuestion
        name="mental_health_treatment"
        detailRequired
        label="¿Estás o has estado en tratamiento psiquiátrico o psicológico?"
        hint="Si es así, cuéntanos por qué motivo y hace cuánto."
        placeholder="Motivo y hace cuánto tiempo."
      />
      <YesNoQuestion
        name="current_medication"
        detailRequired
        label="¿Estás en algún tratamiento médico actualmente?"
        hint="Qué medicamentos tomás, con o sin receta. Incluí antidepresivos, ansiolíticos, analgésicos, suplementos y hierbas."
        placeholder="Medicamentos, suplementos y hierbas."
      />

      <p className="text-sm text-on-surface-variant leading-relaxed py-4 border-b border-outline-variant/40">
        Te pedimos responder con la mayor honestidad y detalle posible. Esta
        información es confidencial y su único propósito es cuidarte. Nada de lo
        que nos cuentes cierra la puerta de entrada: solo nos permite saber qué
        cuidados necesita tu proceso, y conversarlo contigo con calma.
      </p>

      <div className="flex flex-col gap-1.5 py-4">
        <label className={labelClass}>
          Tema o intención que quieres trabajar (opcional)
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
