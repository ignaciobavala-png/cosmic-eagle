"use client";

import { deleteArticle } from "./actions";

export function DeleteArticleButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteArticle.bind(null, id)}
      onSubmit={(e) => {
        if (
          !confirm(
            `¿Eliminar el contenido "${title}"? Esta acción no se puede deshacer.`
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
