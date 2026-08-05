"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { updatePassword, type NewPasswordState } from "./actions";

const initialState: NewPasswordState = { error: null };

export function NewPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      action={formAction}
      className="glass-card rounded-2xl p-8 w-full max-w-sm flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="new-password"
          className="text-sm text-on-surface-variant tracking-[0.02em]"
        >
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
            className="bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 pr-11 w-full text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant hover:text-primary-fixed-dim transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="new-password-confirm"
          className="text-sm text-on-surface-variant tracking-[0.02em]"
        >
          Repetir contraseña
        </label>
        <input
          id="new-password-confirm"
          name="password_confirm"
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          autoComplete="new-password"
          className="bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 w-full text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors"
        />
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
        {pending ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}
