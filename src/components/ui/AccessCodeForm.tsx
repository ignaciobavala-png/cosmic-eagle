"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { redeemAccessCode, type RedeemState } from "@/app/contenidos/actions";

/**
 * Canje del codigo de acceso. Es el modal dorado que dibujo Julia (video del
 * 02/09), pero **no es un login**: exige sesion abierta y lo unico que hace es
 * pegarle el permiso a esa cuenta. Sin sesion, el server action responde
 * `sin_sesion` y el muro de arriba ya ofrece el link para entrar.
 */
export function AccessCodeForm({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [state, formAction, pending] = useActionState<RedeemState, FormData>(
    redeemAccessCode,
    { message: null, ok: false }
  );

  const light = tone === "light";

  return (
    <form action={formAction} className="mt-6">
      <label
        htmlFor="access-code"
        className={`flex items-center justify-center gap-2 text-label-sm uppercase ${
          light ? "text-on-primary-container" : "text-primary-container"
        }`}
      >
        <KeyRound size={14} aria-hidden="true" />
        ¿Tenés un código de acceso?
      </label>

      <div className="mx-auto mt-3 flex max-w-sm flex-col gap-3 sm:flex-row">
        <input
          id="access-code"
          name="code"
          type="text"
          required
          autoComplete="off"
          placeholder="TULUM-2026"
          className={`min-w-0 flex-1 rounded-lg border px-4 py-2.5 text-center uppercase tracking-[0.12em] transition-colors focus:outline-none ${
            light
              ? "border-on-primary-container/40 bg-white/70 text-[#05125a] focus:border-on-primary-container"
              : "border-primary-container/45 bg-white/10 text-white focus:border-primary-container"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#f9d78f] px-6 py-2.5 text-label-sm uppercase text-[#05125a] transition-colors hover:bg-primary-fixed disabled:opacity-40"
        >
          {pending ? "Canjeando…" : "Entrar"}
        </button>
      </div>

      {state.message && (
        <p
          role="status"
          className={`mt-3 text-center text-body-md ${
            state.ok
              ? light
                ? "text-on-primary-container"
                : "text-primary-container"
              : "text-error"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
