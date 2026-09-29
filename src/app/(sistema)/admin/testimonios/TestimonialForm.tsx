"use client";

import { useActionState } from "react";
import Link from "next/link";
import { TESTIMONIAL_PLACEMENTS, TESTIMONIAL_MAX_CHARS } from "@/lib/testimonials";
import type { TestimonialFormState } from "./actions";

type Values = {
  placement: string;
  quote: string;
  author_name: string;
  author_location: string | null;
  sort_order: number;
  is_published: boolean;
};

const FIELD =
  "w-full rounded-lg border border-outline bg-surface-container px-4 py-2.5 text-on-surface outline-none focus:border-primary-fixed-dim";

/**
 * Alta y edicion de un testimonio. Es el mismo formulario para los dos casos: el
 * server action ya viene atado (con el id, en el caso de editar).
 */
export function TestimonialForm({
  action,
  values,
  submitLabel,
}: {
  action: (
    state: TestimonialFormState,
    formData: FormData
  ) => Promise<TestimonialFormState>;
  values?: Values;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="glass-card max-w-2xl rounded-2xl p-6 space-y-5">
      <div>
        <label htmlFor="placement" className="mb-1.5 block text-sm text-on-surface-variant">
          ¿En qué sección va?
        </label>
        <select
          id="placement"
          name="placement"
          defaultValue={values?.placement ?? "home"}
          className={FIELD}
        >
          {TESTIMONIAL_PLACEMENTS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-on-surface-variant">
          Cada sección tiene sus propios testimonios. Si el mismo texto sirve
          para dos, cargalo dos veces.
        </p>
      </div>

      <div>
        <label htmlFor="quote" className="mb-1.5 block text-sm text-on-surface-variant">
          Testimonio
        </label>
        <textarea
          id="quote"
          name="quote"
          rows={6}
          required
          maxLength={TESTIMONIAL_MAX_CHARS}
          defaultValue={values?.quote}
          className={FIELD}
        />
        <p className="mt-1.5 text-xs text-on-surface-variant">
          Se muestra entre comillas. No hace falta escribirlas. Máximo{" "}
          {TESTIMONIAL_MAX_CHARS} caracteres: la tarjeta del carrusel tiene alto
          fijo y un texto más largo se corta.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="author_name" className="mb-1.5 block text-sm text-on-surface-variant">
            Nombre
          </label>
          <input
            id="author_name"
            name="author_name"
            required
            defaultValue={values?.author_name}
            className={FIELD}
          />
        </div>
        <div>
          <label
            htmlFor="author_location"
            className="mb-1.5 block text-sm text-on-surface-variant"
          >
            País o ciudad <span className="text-on-surface-variant/60">(opcional)</span>
          </label>
          <input
            id="author_location"
            name="author_location"
            defaultValue={values?.author_location ?? ""}
            className={FIELD}
          />
        </div>
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
        <Link href="/admin/testimonios" className="text-sm text-on-surface-variant hover:underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
