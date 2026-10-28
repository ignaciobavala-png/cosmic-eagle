"use client";

import { deleteMaterial } from "./actions";

export function DeleteMaterialButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteMaterial.bind(null, id)}
      onSubmit={(e) => {
        if (
          !confirm(
            `¿Eliminar "${title}"? Si ya mandaste el link, deja de abrir. Esta acción no se puede deshacer.`
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
