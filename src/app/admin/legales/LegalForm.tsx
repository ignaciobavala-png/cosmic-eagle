"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateLegalDocument, type LegalFormState } from "./actions";

/**
 * El editor de un documento legal. Es un textarea grande y nada más: el cuerpo
 * es texto plano con las mismas reglas que un contenido de la biblioteca, y la
 * ayuda de abajo las repite para no obligar a nadie a acordarse.
 */
export function LegalForm({
  slug,
  href,
  title,
  body,
  isProvisional,
}: {
  slug: string;
  href: string;
  title: string;
  body: string;
  isProvisional: boolean;
}) {
  const [state, formAction, pending] = useActionState<LegalFormState, FormData>(
    updateLegalDocument.bind(null, slug),
    { error: null }
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div>
        <label
          htmlFor="title"
          className="text-label-sm uppercase tracking-wider text-primary-fixed-dim"
        >
          Título de la página
        </label>
        <input
          id="title"
          name="title"
          defaultValue={title}
          required
          maxLength={120}
          className="mt-2 w-full rounded-2xl border border-primary-fixed-dim/30 bg-black/20 px-4 py-3 text-body-md text-on-surface"
        />
      </div>

      <div>
        <label
          htmlFor="body"
          className="text-label-sm uppercase tracking-wider text-primary-fixed-dim"
        >
          Texto del documento
        </label>
        <textarea
          id="body"
          name="body"
          defaultValue={body}
          required
          rows={30}
          className="mt-2 w-full rounded-2xl border border-primary-fixed-dim/30 bg-black/20 px-4 py-3 font-mono text-sm leading-relaxed text-on-surface"
        />
        <p className="mt-2 text-body-md text-on-surface/70">
          Se escribe como texto normal. Una línea en blanco empieza un párrafo
          nuevo; <code>## </code> hace un título y <code>### </code> un
          subtítulo; <code>- </code> al principio de una línea hace un punteo, y{" "}
          <code>&gt; </code> destaca una frase. Para resaltar el comienzo de un
          punteo, escribilo entre <code>**</code>.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-primary-fixed-dim/25 px-4 py-3">
        <input
          type="checkbox"
          name="is_provisional"
          defaultChecked={isProvisional}
          className="mt-1"
        />
        <span className="text-body-md text-on-surface">
          <span className="font-semibold text-primary-container">
            Marcar como versión preliminar
          </span>
          <br />
          Mientras esté tildado, la página pública muestra un aviso arriba de
          todo diciendo que el texto está en revisión. Destildalo cuando el
          documento esté aprobado.
        </span>
      </label>

      {state.error && (
        <p className="text-body-md text-red-300">{state.error}</p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary-container px-7 py-3 text-label-sm uppercase tracking-wider text-on-primary disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <Link
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-body-md text-primary-fixed-dim underline-offset-4 hover:underline"
        >
          Ver la página publicada ↗
        </Link>
      </div>
    </form>
  );
}
