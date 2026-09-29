"use client";

import { useActionState, useState } from "react";
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
  const [state, formAction, pending] = useActionState(signup, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction}>
      {next && <input type="hidden" name="next" value={next} />}

      <div className={fieldWrap}>
        <label htmlFor="full_name" className={fieldLabel}>
          Nombre completo
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          autoComplete="name"
          placeholder="Tu nombre y apellido"
          className={fieldInput}
        />
      </div>

      <div className={fieldWrap}>
        <label htmlFor="signup-email" className={fieldLabel}>
          Email
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@email.com"
          className={fieldInput}
        />
      </div>

      <div className="mb-9">
        <label htmlFor="signup-password" className={fieldLabel}>
          Contraseña
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
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className={fieldToggle}
          >
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
        <p className={fieldHint}>Mínimo 8 caracteres.</p>
      </div>

      {state.error && (
        <p className={formError} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={submitButton}>
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}
