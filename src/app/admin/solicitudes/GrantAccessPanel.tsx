"use client";

import { useActionState } from "react";
import { GRANTABLE_LEVELS } from "@/lib/content-access";
import {
  grantContentAccess,
  revokeContentGrant,
  type AccessFormState,
} from "@/app/admin/acceso/actions";

/**
 * Habilitar a esta persona a leer los contenidos del programa. Va acá, en la
 * solicitud, porque es el momento en que se decide: ya se aprobó y se registró
 * el pago (decision de Ignacio, 08/09 — siempre a mano, nunca automático).
 */
export function GrantAccessPanel({
  userId,
  fullName,
  grant,
}: {
  userId: string;
  fullName: string;
  grant: { id: string; level: string; granted_at: string } | null;
}) {
  const [state, formAction, pending] = useActionState<AccessFormState, FormData>(
    grantContentAccess,
    { error: null }
  );

  if (grant) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">
          Habilitada desde el{" "}
          {new Date(grant.granted_at).toLocaleDateString("es-CL")}. Ve todos los
          contenidos del programa.
        </p>
        <form
          action={revokeContentGrant.bind(null, grant.id)}
          onSubmit={(event) => {
            if (!confirm(`¿Quitarle el acceso a ${fullName}?`)) {
              event.preventDefault();
            }
          }}
        >
          <button type="submit" className="text-sm text-error hover:underline">
            Quitar el acceso
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="user_id" value={userId} />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="grant_level"
          className="text-sm tracking-[0.02em] text-on-surface-variant"
        >
          Nivel
        </label>
        <select
          id="grant_level"
          name="level"
          defaultValue="programa"
          className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-on-surface transition-colors focus:border-primary-fixed-dim focus:outline-none"
        >
          {GRANTABLE_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex min-w-48 flex-1 flex-col gap-1.5">
        <label
          htmlFor="grant_note"
          className="text-sm tracking-[0.02em] text-on-surface-variant"
        >
          Nota (opcional)
        </label>
        <input
          id="grant_note"
          name="note"
          type="text"
          placeholder="Ya ceremonió con nosotras"
          className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-on-surface transition-colors focus:border-primary-fixed-dim focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary-container px-6 py-2.5 text-sm font-medium tracking-[0.05em] text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-40"
      >
        {pending ? "Habilitando…" : "Habilitar contenidos"}
      </button>

      {state.error && (
        <p className="w-full text-sm text-error">{state.error}</p>
      )}
    </form>
  );
}
