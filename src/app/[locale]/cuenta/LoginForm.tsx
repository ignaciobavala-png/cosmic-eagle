"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  FieldError,
  RequiredLegend,
  RequiredMark,
  ValidatedForm,
} from "@/components/forms/validation";
import { Link } from "@/i18n/navigation";
import { Eye, EyeOff } from "lucide-react";
import { login, type LoginState } from "./actions";
import {
  fieldInput,
  fieldInputPassword,
  fieldLabel,
  fieldToggle,
  fieldWrap,
  formError,
  submitButton,
} from "./fields";

const initialState: LoginState = { error: null };

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("Cuenta");
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);
  // El mail va controlado: React 19 vacía el formulario después de cada
  // action, también cuando vuelve con error, y con la contraseña mal se perdía
  // el mail (Sofía, 06/10). La contraseña sí se vacía, que es lo esperable.
  const [email, setEmail] = useState("");

  return (
    <ValidatedForm action={formAction}>
      <RequiredLegend className="mb-5" />
      {next && <input type="hidden" name="next" value={next} />}

      <div className={fieldWrap}>
        <label htmlFor="email" className={fieldLabel}>
          {t("login.email")}
          <RequiredMark />
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("login.emailPlaceholder")}
          className={fieldInput}
        />
        <FieldError name="email" />
      </div>

      <div className={fieldWrap}>
        <label htmlFor="password" className={fieldLabel}>
          {t("login.password")}
          <RequiredMark />
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
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
        <FieldError name="password" />
      </div>

      {/* Arriba del botón y alineado a la derecha, como en el mockup: el margen
          negativo lo pega al campo de contraseña. */}
      <Link
        href="/cuenta/recuperar"
        className="-mt-1.5 mb-6.5 block text-right text-[12.5px] text-white/55 transition-colors duration-200 hover:text-primary-container"
      >
        {t("login.forgot")}
      </Link>

      {state.error && (
        <p className={formError} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={submitButton}>
        {pending ? t("login.pending") : t("login.submit")}
      </button>
    </ValidatedForm>
  );
}
