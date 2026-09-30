"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { signup, type SignupState } from "./actions";
import {
  fieldHint,
  fieldInput,
  fieldInputPassword,
  fieldLabel,
  fieldToggle,
  fieldWrap,
  formError,
  submitButton,
} from "./fields";

const initialState: SignupState = { error: null };

export function SignupForm({ next }: { next?: string }) {
  const t = useTranslations("Cuenta");
  const [state, formAction, pending] = useActionState(signup, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction}>
      {next && <input type="hidden" name="next" value={next} />}

      <div className={fieldWrap}>
        <label htmlFor="full_name" className={fieldLabel}>
          {t("signup.fullName")}
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          autoComplete="name"
          placeholder={t("signup.fullNamePlaceholder")}
          className={fieldInput}
        />
      </div>

      <div className={fieldWrap}>
        <label htmlFor="signup-email" className={fieldLabel}>
          {t("login.email")}
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t("login.emailPlaceholder")}
          className={fieldInput}
        />
      </div>

      <div className="mb-9">
        <label htmlFor="signup-password" className={fieldLabel}>
          {t("login.password")}
        </label>
        <div className="relative">
          <input
            id="signup-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
            className={fieldInputPassword}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
            className={fieldToggle}
          >
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
        <p className={fieldHint}>{t("signup.hint")}</p>
      </div>

      {state.error && (
        <p className={formError} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={submitButton}>
        {pending ? t("signup.pending") : t("signup.submit")}
      </button>
    </form>
  );
}
