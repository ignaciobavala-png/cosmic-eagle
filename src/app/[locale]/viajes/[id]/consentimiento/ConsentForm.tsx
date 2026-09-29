"use client";

import { useActionState, useState } from "react";
import {
  CONSENT_CONFIRMATIONS,
  CONSENT_SIGNATURE_HINT,
  CONSENT_SIGNATURE_LABEL,
} from "@/lib/consent";
import {
  fieldInput,
  fieldHint,
  fieldLabel,
  panelDivider,
  panelTitle,
  submitButton,
} from "@/components/forms/styles";
import { submitConsent, type ConsentFormState } from "./actions";

/**
 * Las cuatro confirmaciones y la firma.
 *
 * El botón se habilita recién con las cuatro marcadas y el nombre escrito.
 * Igual el server action las vuelve a exigir: deshabilitar un botón no es una
 * validación.
 */
export function ConsentForm({
  tripId,
  applicationId,
  defaultName,
}: {
  tripId: string;
  applicationId: string;
  defaultName?: string;
}) {
  const [state, formAction, pending] = useActionState<
    ConsentFormState,
    FormData
  >(submitConsent.bind(null, tripId, applicationId), { error: null });

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [signature, setSignature] = useState(defaultName ?? "");

  const todasMarcadas = CONSENT_CONFIRMATIONS.every((c) => checked[c.id]);
  const firmado = signature.trim().length >= 5 && signature.trim().includes(" ");

  return (
    <form action={formAction} className="mt-8">
      <h2 className={panelTitle}>Confirmaciones requeridas</h2>

      <ul className="mt-4 flex flex-col">
        {CONSENT_CONFIRMATIONS.map((item) => (
          <li key={item.id} className={`border-b py-3 last:border-0 ${panelDivider}`}>
            <label className="flex cursor-pointer items-start gap-3 text-white">
              <input
                type="checkbox"
                name={item.id}
                checked={!!checked[item.id]}
                onChange={(e) =>
                  setChecked((prev) => ({ ...prev, [item.id]: e.target.checked }))
                }
                className="mt-1 h-4 w-4 shrink-0 accent-[#f9d78f]"
              />
              <span className="text-sm leading-relaxed">{item.label}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <label htmlFor="signature" className={fieldLabel}>
          {CONSENT_SIGNATURE_LABEL}
        </label>
        <input
          id="signature"
          name="signature"
          type="text"
          autoComplete="name"
          required
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          /* La firma va en la tipografía de títulos: es lo que la distingue de
             un campo más del formulario. */
          className={`${fieldInput} font-display text-lg`}
        />
        <p className={fieldHint}>{CONSENT_SIGNATURE_HINT}</p>
      </div>

      {state.error && (
        <p className="mt-4 text-sm text-[#ffb4a8]" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !todasMarcadas || !firmado}
        className={`mt-8 ${submitButton}`}
      >
        {pending ? "Registrando..." : "Firmar el consentimiento"}
      </button>
    </form>
  );
}
