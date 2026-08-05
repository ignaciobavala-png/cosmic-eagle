"use client";

import { useActionState } from "react";
import { requestPasswordReset, type RecoverState } from "./actions";

const initialState: RecoverState = { error: null, sent: false };

export function RecoverForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState
  );

  if (state.sent) {
    return (
      <div className="glass-card rounded-2xl p-8 w-full max-w-sm text-center">
        <p className="text-on-surface">
          Si hay una cuenta con ese email, te llega un enlace para crear una
          contraseña nueva.
        </p>
        <p className="text-on-surface-variant text-sm mt-3">
          Revisá también la carpeta de spam. El enlace vence en una hora y sirve
          una sola vez.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="glass-card rounded-2xl p-8 w-full max-w-sm flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="recover-email"
          className="text-sm text-on-surface-variant tracking-[0.02em]"
        >
          Email
        </label>
        <input
          id="recover-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors"
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
        {pending ? "Enviando..." : "Enviarme el enlace"}
      </button>
    </form>
  );
}
