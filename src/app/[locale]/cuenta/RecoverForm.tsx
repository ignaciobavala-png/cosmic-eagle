"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { requestPasswordReset, type RecoverState } from "./actions";
import {
  fieldInput,
  fieldLabel,
  fieldWrap,
  formError,
  submitButton,
} from "./fields";

const initialState: RecoverState = { error: null, sent: false };

export function RecoverForm() {
  const t = useTranslations("Cuenta");
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState
  );

  if (state.sent) {
    return (
      <div className="rounded-lg border border-white/[0.18] bg-white/5 p-6">
        <p className="text-white">{t("recover.sentTitle")}</p>
        <p className="mt-3 text-sm text-white/60">{t("recover.sentHint")}</p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <div className={fieldWrap}>
        <label htmlFor="recover-email" className={fieldLabel}>
          {t("login.email")}
        </label>
        <input
          id="recover-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t("login.emailPlaceholder")}
          className={fieldInput}
        />
      </div>

      {state.error && (
        <p className={formError} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={submitButton}>
        {pending ? t("recover.pending") : t("recover.submit")}
      </button>
    </form>
  );
}
