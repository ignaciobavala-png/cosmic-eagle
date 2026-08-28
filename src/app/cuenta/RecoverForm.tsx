"use client";

import { useActionState } from "react";
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
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState
  );

  if (state.sent) {
    return (
      <div className="rounded-lg border border-white/[0.18] bg-white/5 p-6">
        <p className="text-white">
          Si hay una cuenta con ese email, te llega un enlace para crear una
          contraseña nueva.
        </p>
        <p className="mt-3 text-sm text-white/60">
          Revisa también la carpeta de spam. El enlace vence en una hora y sirve
          una sola vez.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <div className={fieldWrap}>
        <label htmlFor="recover-email" className={fieldLabel}>
          Email
        </label>
        <input
          id="recover-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@email.com"
          className={fieldInput}
        />
      </div>

      {state.error && (
        <p className={formError} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={submitButton}>
        {pending ? "Enviando..." : "Enviarme el enlace"}
      </button>
    </form>
  );
}
