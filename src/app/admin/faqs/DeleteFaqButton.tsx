"use client";

import { deleteFaq } from "./actions";

export function DeleteFaqButton({ id, question }: { id: string; question: string }) {
  return (
    <form
      action={deleteFaq.bind(null, id)}
      onSubmit={(e) => {
        if (
          !confirm(
            `¿Eliminar la pregunta "${question}"? Esta acción no se puede deshacer.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-error hover:underline">
        Eliminar
      </button>
    </form>
  );
}
