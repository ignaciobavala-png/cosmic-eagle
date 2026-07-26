"use client";

import { deleteTrip } from "./actions";

export function DeleteTripButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteTrip.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar el viaje "${title}"? Esta acción no se puede deshacer.`)) {
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
