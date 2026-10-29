"use client";

import { useActionState } from "react";
import type { Tables } from "@/lib/supabase/types";
import type { MaterialFormState } from "./actions";

const inputClass =
  "bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors";
const labelClass = "text-sm text-on-surface-variant tracking-[0.02em]";

/** Titulo + el .html que arma la organizacion en su computadora. */
export function MaterialForm({
  material,
  action,
}: {
  material?: Pick<Tables<"materiales">, "title" | "html">;
  action: (
    prevState: MaterialFormState,
    formData: FormData
  ) => Promise<MaterialFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form
      action={formAction}
      className="glass-card rounded-2xl p-5 md:p-8 flex flex-col gap-5 max-w-2xl"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className={labelClass}>
          Título
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={material?.title ?? ""}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="html" className={labelClass}>
          Archivo HTML
        </label>
        <input
          id="html"
          name="html"
          type="file"
          accept=".html,.htm,text/html"
          required={!material}
          className="text-sm text-on-surface-variant file:mr-3 file:rounded-lg file:border file:border-outline-variant file:bg-surface-container-low file:px-3 file:py-1.5 file:text-sm file:text-on-surface-variant"
        />
        <p className="text-xs text-on-surface-variant">
          Hasta 3MB. Si lleva fotos, que estén dentro del archivo (o en links
          públicos) y comprimidas.
          {material?.html && " Si no eliges uno, se mantiene el actual."}
        </p>
      </div>

      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {state.saved && <p className="text-sm text-primary-fixed-dim">Guardado.</p>}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="bg-primary-container text-on-primary font-medium tracking-[0.05em] rounded-lg px-6 py-2.5 text-sm hover:bg-primary-fixed transition-colors disabled:opacity-40"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
