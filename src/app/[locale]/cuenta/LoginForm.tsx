"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
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
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction}>
      {next && <input type="hidden" name="next" value={next} />}

      <div className={fieldWrap}>
        <label htmlFor="email" className={fieldLabel}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@email.com"
          className={fieldInput}
        />
      </div>

      <div className={fieldWrap}>
        <label htmlFor="password" className={fieldLabel}>
          Contraseña
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
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className={fieldToggle}
          >
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
      </div>

      {/* Arriba del botón y alineado a la derecha, como en el mockup: el margen
          negativo lo pega al campo de contraseña. */}
      <Link
        href="/cuenta/recuperar"
        className="-mt-1.5 mb-6.5 block text-right text-[12.5px] text-white/55 transition-colors duration-200 hover:text-primary-container"
      >
        ¿Olvidaste tu contraseña?
      </Link>

      {state.error && (
        <p className={formError} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={submitButton}>
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
