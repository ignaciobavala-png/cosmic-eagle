"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FAQ_PLACEMENTS } from "@/lib/faqs";
import type { FaqFormState } from "./actions";

type Values = {
  placement: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
};

const FIELD =
  "w-full rounded-lg border border-outline bg-surface-container px-4 py-2.5 text-on-surface outline-none focus:border-primary-fixed-dim";

/**
 * Alta y edicion de una pregunta. Es el mismo formulario para los dos casos: el
 * server action ya viene atado (con el id, en el caso de editar).
 */
export function FaqForm({
  action,
  values,
  submitLabel,
}: {
  action: (state: FaqFormState, formData: FormData) => Promise<FaqFormState>;
  values?: Values;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="glass-card max-w-2xl rounded-2xl p-6 space-y-5">
      <div>
        <label htmlFor="placement" className="mb-1.5 block text-sm text-on-surface-variant">
          ¿En qué bloque va?
        </label>
        <select
          id="placement"
          name="placement"
          defaultValue={values?.placement ?? "general"}
          className={FIELD}
        >
          {FAQ_PLACEMENTS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-on-surface-variant">
          Una pregunta vive en un solo bloque. Si la respuesta cambia según la
          experiencia, cargala dos veces con la respuesta de cada una.
        </p>
      </div>

      <div>
        <label htmlFor="question" className="mb-1.5 block text-sm text-on-surface-variant">
          Pregunta
        </label>
        <input
          id="question"
          name="question"
          required
          defaultValue={values?.question}
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor="answer" className="mb-1.5 block text-sm text-on-surface-variant">
          Respuesta
        </label>
        <textarea
          id="answer"
          name="answer"
          rows={8}
          required
          defaultValue={values?.answer}
          className={FIELD}
        />
        <p className="mt-1.5 text-xs text-on-surface-variant">
          Dejá una línea en blanco entre párrafos. No se puede usar HTML ni
          negritas: se muestra tal cual lo escribas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
        <div>
          <label htmlFor="sort_order" className="mb-1.5 block text-sm text-on-surface-variant">
            Orden
          </label>
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue={values?.sort_order ?? 0}
            className={FIELD}
          />
          <p className="mt-1.5 text-xs text-on-surface-variant">
            Los más chicos aparecen primero.
          </p>
        </div>

        <label className="flex items-center gap-2 pb-2 text-sm text-on-surface">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={values?.is_published ?? true}
            className="h-4 w-4 accent-[#f9d78f]"
          />
          Visible en el sitio
        </label>
      </div>

      {state.error && <p className="text-sm text-error">{state.error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary-container px-5 py-2.5 text-sm font-medium tracking-[0.05em] text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-60"
        >
          {pending ? "Guardando…" : submitLabel}
        </button>
        <Link href="/admin/faqs" className="text-sm text-on-surface-variant hover:underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
