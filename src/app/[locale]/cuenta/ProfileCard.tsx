"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import { PhoneInput } from "@/components/forms/fields";
import {
  fieldInput,
  fieldLabel,
  fieldWrap,
  formError,
  ghostButton,
  panel,
  panelDivider,
  panelTitle,
  submitButton,
} from "@/components/forms/styles";
import { splitPhone } from "@/lib/phone-countries";
import { capitalizeName } from "@/lib/person-name";
import { updateProfile, type ProfileState } from "./actions";
import { REFERRAL_SOURCES } from "./profile-fields";

export type ProfileData = {
  full_name: string | null;
  phone: string | null;
  profession: string | null;
  social_url: string | null;
  prior_experience: string | null;
  spiritual_practices: string | null;
  referral_source: string | null;
  referred_by: string | null;
  profile_completed_at: string | null;
};

const initialState: ProfileState = { error: null, saved: false };

/**
 * El perfil personal de /cuenta (correcciones de la organización, 03/10,
 * §5.1). Hay varios caminos para crear una cuenta —para acceder a la
 * biblioteca, desde el calendario, antes de postular— y este perfil es la
 * base común a todos.
 *
 * Mientras no está completo, el formulario va abierto: es lo primero que ve
 * quien acaba de registrarse. Ya completo, se muestra como ficha de lectura con
 * un "Editar". La ficha médica NO está acá (opción A): sigue en el filtro corto
 * y el formulario de salud de cada solicitud.
 */
export function ProfileCard({ profile }: { profile: ProfileData }) {
  const t = useTranslations("Cuenta.profile");
  const complete = profile.profile_completed_at !== null;
  const [editing, setEditing] = useState(!complete);
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const [referral, setReferral] = useState(profile.referral_source ?? "");
  const phone = splitPhone(profile.phone);

  // Guardado: vuelve a la ficha. El server action ya revalidó la página, así
  // que `profile` llega con los datos nuevos. Se ajusta durante el render (y
  // no en un efecto) comparando contra el último resultado visto.
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.saved) setEditing(false);
  }

  if (!editing) {
    const rows: [string, string | null][] = [
      [t("phone"), profile.phone],
      [t("profession"), profile.profession],
      [t("social"), profile.social_url],
      [t("prior"), profile.prior_experience],
      [t("practices"), profile.spiritual_practices],
      [
        t("referral.label"),
        profile.referral_source
          ? `${t(`referral.${profile.referral_source}`)}${
              profile.referred_by ? ` · ${profile.referred_by}` : ""
            }`
          : null,
      ],
    ];

    return (
      <section className={`${panel} w-full p-6 sm:p-8`}>
        <div className="flex items-center justify-between gap-4">
          <h2 className={panelTitle}>{t("title")}</h2>
          <button type="button" onClick={() => setEditing(true)} className={ghostButton}>
            <Pencil size={14} aria-hidden="true" />
            {t("edit")}
          </button>
        </div>
        {state.saved && (
          <p role="status" className="mt-3 text-sm text-primary-container">
            {t("saved")}
          </p>
        )}
        <dl className={`mt-5 divide-y ${panelDivider}`}>
          {rows.map(([label, value]) => (
            <div key={label} className="py-3 sm:grid sm:grid-cols-[11rem_1fr] sm:gap-4">
              <dt className="text-[11px] uppercase tracking-[0.14em] text-white/55">
                {label}
              </dt>
              <dd className="mt-1 whitespace-pre-line break-words text-[15px] text-white sm:mt-0">
                {value || "—"}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    );
  }

  return (
    <section className={`${panel} w-full p-6 sm:p-8`}>
      <h2 className={panelTitle}>{complete ? t("title") : t("completeTitle")}</h2>
      {!complete && <p className="mt-2 text-[15px] text-white/75">{t("intro")}</p>}

      <form action={formAction} className="mt-6">
        <div className={fieldWrap}>
          <label htmlFor="profile-name" className={fieldLabel}>
            {t("fullName")}
          </label>
          <input
            id="profile-name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            defaultValue={profile.full_name ? capitalizeName(profile.full_name) : ""}
            className={fieldInput}
          />
        </div>

        <div className={fieldWrap}>
          <span className={fieldLabel}>{t("phone")}</span>
          <PhoneInput required defaultCountry={phone.country} defaultNumber={phone.number} />
        </div>

        <div className={fieldWrap}>
          <label htmlFor="profile-profession" className={fieldLabel}>
            {t("profession")}
          </label>
          <input
            id="profile-profession"
            name="profession"
            type="text"
            required
            autoComplete="organization-title"
            defaultValue={profile.profession ?? ""}
            className={fieldInput}
          />
        </div>

        <div className={fieldWrap}>
          <label htmlFor="profile-social" className={fieldLabel}>
            {t("social")} <span className="normal-case tracking-normal">{t("optional")}</span>
          </label>
          <input
            id="profile-social"
            name="social_url"
            type="text"
            inputMode="url"
            placeholder={t("socialPlaceholder")}
            defaultValue={profile.social_url ?? ""}
            className={fieldInput}
          />
        </div>

        <div className={fieldWrap}>
          <label htmlFor="profile-prior" className={fieldLabel}>
            {t("prior")}
          </label>
          <textarea
            id="profile-prior"
            name="prior_experience"
            required
            rows={3}
            placeholder={t("priorPlaceholder")}
            defaultValue={profile.prior_experience ?? ""}
            className={fieldInput}
          />
        </div>

        <div className={fieldWrap}>
          <label htmlFor="profile-practices" className={fieldLabel}>
            {t("practices")}
          </label>
          <textarea
            id="profile-practices"
            name="spiritual_practices"
            required
            rows={3}
            placeholder={t("practicesPlaceholder")}
            defaultValue={profile.spiritual_practices ?? ""}
            className={fieldInput}
          />
        </div>

        <div className={fieldWrap}>
          <label htmlFor="profile-referral" className={fieldLabel}>
            {t("referral.label")}
          </label>
          <select
            id="profile-referral"
            name="referral_source"
            required
            value={referral}
            onChange={(event) => setReferral(event.target.value)}
            className={fieldInput}
          >
            <option value="" disabled>
              {t("referral.choose")}
            </option>
            {REFERRAL_SOURCES.map((source) => (
              <option key={source} value={source} className="text-[#05125a]">
                {t(`referral.${source}`)}
              </option>
            ))}
          </select>
        </div>

        {referral === "referido" && (
          <div className={fieldWrap}>
            <label htmlFor="profile-referred-by" className={fieldLabel}>
              {t("referredBy")}
            </label>
            <input
              id="profile-referred-by"
              name="referred_by"
              type="text"
              required
              defaultValue={profile.referred_by ?? ""}
              className={fieldInput}
            />
          </div>
        )}

        {state.error && (
          <p className={formError} role="alert">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className={`${submitButton} mt-3`}>
          {pending ? t("pending") : t("submit")}
        </button>

        {complete && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="mt-4 w-full text-sm text-white/60 underline transition-colors hover:text-primary-container"
          >
            {t("cancel")}
          </button>
        )}
      </form>
    </section>
  );
}
