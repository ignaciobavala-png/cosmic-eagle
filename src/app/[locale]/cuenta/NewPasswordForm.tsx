"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { updatePassword, type NewPasswordState } from "./actions";
import {
  fieldInput,
  fieldInputPassword,
  fieldLabel,
  fieldToggle,
  fieldWrap,
  formError,
  submitButton,
} from "./fields";

const initialState: NewPasswordState = { error: null };

export function NewPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction}>
      <div className={fieldWrap}>
        <label htmlFor="new-password" className={fieldLabel}>
          Contraseña nueva
        </label>
        <div className="relative">
          <input
            id="new-password"
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
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className={fieldToggle}
          >
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
      </div>

      <div className="mb-9">
        <label htmlFor="new-password-confirm" className={fieldLabel}>
          Repetir contraseña
        </label>
        <input
          id="new-password-confirm"
          name="password_confirm"
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="••••••••"
          className={fieldInput}
        />
      </div>

      {state.error && (
        <p className={formError} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={submitButton}>
        {pending ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}
