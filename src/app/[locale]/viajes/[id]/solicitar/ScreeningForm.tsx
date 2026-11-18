"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  NumberInput,
  PhoneInput,
  YesNoQuestion,
  inputClass,
  labelClass,
} from "@/components/forms/fields";
import {
  panel,
  panelBody,
  panelDivider,
  panelTitle,
  submitButton,
} from "@/components/forms/styles";
import {
  FieldError,
  RequiredLegend,
  RequiredMark,
  ValidatedForm,
} from "@/components/forms/validation";
import { submitApplication, type ApplicationFormState } from "./actions";

/**
 * El filtro corto: lo llenan todos, primerizos y recurrentes.
 *
 * El encuadre y las tres preguntas son el texto que mandó Sofía el 19/08/2026,
 * literal. No reescribirlo sin consultar: es copy de la clienta. Vive en
 * `messages/es.json` (namespace `Screening`); el inglés es traducción de ese
 * texto. Los errores de campo salen de `ValidatedForm` (`noValidate`).
 *
 * Ojo con lo que dice ese texto: "nada de lo que nos cuentes cierra la puerta
 * de entrada". El encuadre es INFORMATIVO, no excluyente — ninguna respuesta
 * rechaza sola, todas las solicitudes las lee Estela.
 */
export function ScreeningForm({
  tripId,
  defaultEmail,
  suggestedCode = "",
}: {
  tripId: string;
  defaultEmail?: string;
  /** Código que la organización le asignó a esta persona, si tiene uno. */
  suggestedCode?: string;
}) {
  const t = useTranslations("Screening");
  const [state, formAction, pending] = useActionState<
    ApplicationFormState,
    FormData
  >(submitApplication.bind(null, tripId), { error: null });

  return (
    <ValidatedForm
      action={formAction}
      className={`flex max-w-2xl flex-col gap-2 p-6 md:p-8 ${panel}`}
    >
      <div
        className={`mb-2 flex flex-col gap-3 border-b pb-6 text-sm leading-relaxed ${panelDivider} ${panelBody}`}
      >
        <p className="text-white">{t("intro1")}</p>
        <p>{t("intro2")}</p>
        <p>{t("intro3")}</p>
        <p>{t("intro4")}</p>
      </div>

      <h2 className={`mb-1 ${panelTitle}`}>{t("personalTitle")}</h2>
      <RequiredLegend />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>
            {t("fullName")}
            <RequiredMark />
          </label>
          <input name="full_name" type="text" required className={inputClass} />
          <FieldError name="full_name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>
            {t("email")}
            <RequiredMark />
          </label>
          <input
            name="email"
            type="email"
            required
            defaultValue={defaultEmail}
            className={inputClass}
          />
          <FieldError name="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>
            {t("phone")}
            <RequiredMark />
          </label>
          <PhoneInput required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>
            {t("country")}
            <RequiredMark />
          </label>
          <input
            name="residence_country"
            type="text"
            required
            className={inputClass}
          />
          <FieldError name="residence_country" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>
            {t("previous")}
            <RequiredMark />
          </label>
          <NumberInput name="previous_ceremonies" defaultValue={0} required />
          <span className="text-xs text-white/55">{t("previousHint")}</span>
        </div>
      </div>

      <h2 className={`mb-1 mt-4 ${panelTitle}`}>{t("tellTitle")}</h2>

      <p className={`pb-2 text-sm leading-relaxed ${panelBody}`}>
        {t("tellBody")}
      </p>

      <YesNoQuestion
        name="serious_illness"
        detailRequired
        label={t("illness")}
        hint={t("illnessHint")}
        placeholder={t("illnessPlaceholder")}
      />
      <YesNoQuestion
        name="mental_health_treatment"
        detailRequired
        label={t("mental")}
        hint={t("mentalHint")}
        placeholder={t("mentalPlaceholder")}
      />
      <YesNoQuestion
        name="current_medication"
        detailRequired
        label={t("medication")}
        hint={t("medicationHint")}
        placeholder={t("medicationPlaceholder")}
      />

      <div className="flex flex-col gap-1.5 py-4">
        <label className={labelClass}>{t("theme")}</label>
        <textarea name="theme" rows={2} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5 pb-4">
        <label htmlFor="discount_code" className={labelClass}>
          {t("discount")}
        </label>
        <input
          id="discount_code"
          name="discount_code"
          defaultValue={suggestedCode}
          autoComplete="off"
          maxLength={30}
          className={`${inputClass} uppercase`}
        />
        {suggestedCode && (
          <p className="text-xs text-white/60">{t("discountAssigned")}</p>
        )}
      </div>

      {state.error && (
        <p className="text-sm text-[#ffb4a8]" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`mt-4 ${submitButton}`}
      >
        {pending ? t("pending") : t("submit")}
      </button>
    </ValidatedForm>
  );
}
