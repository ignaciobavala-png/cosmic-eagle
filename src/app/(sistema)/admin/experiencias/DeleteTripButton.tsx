"use client";

import { useActionState } from "react";
import { deleteTrip } from "./actions";

/**
 * El borrado puede fallar por una razon que Estela necesita leer: un viaje con
 * solicitudes no se borra (FK con RESTRICT). Por eso pasa por `useActionState`
 * y no por un `action={...}` suelto, que no recibe nada de vuelta y dejaba el
 * fallo invisible.
 */
export function DeleteTripButton({ id, title }: { id: string; title: string }) {
  const [state, formAction, pending] = useActionState(deleteTrip.bind(null, id), {
    error: null,
  });

  return (
    // Columna: el aviso cae DEBAJO del boton y alineado a la derecha, como el
    // resto de la celda de acciones. En linea empujaria "Editar" y "Eliminar"
    // fuera de la fila. El ancho se acota para que el texto envuelva en vez de
    // estirar la tabla, que ya scrollea en horizontal.
    <form
      action={formAction}
      className="flex flex-col items-end gap-1"
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar el viaje "${title}"? Esta acción no se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="text-error hover:underline disabled:opacity-60"
      >
        {pending ? "Eliminando..." : "Eliminar"}
      </button>

      {state.error && (
        <p className="text-error text-xs text-right max-w-[22rem]" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
