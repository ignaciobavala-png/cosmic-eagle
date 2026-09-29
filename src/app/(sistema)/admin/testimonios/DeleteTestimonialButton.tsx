"use client";

import { deleteTestimonial } from "./actions";

export function DeleteTestimonialButton({
  id,
  author,
}: {
  id: string;
  author: string;
}) {
  return (
    <form
      action={deleteTestimonial.bind(null, id)}
      onSubmit={(e) => {
        if (
          !confirm(
            `¿Eliminar el testimonio de ${author}? Esta acción no se puede deshacer.`
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
