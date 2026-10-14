"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteContact } from "./actions";

export function DeleteContactButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (
      !confirm(
        `¿Eliminar a "${name}"?\n\nSe borra su cuenta y todo lo suyo: solicitudes, formularios de salud, consentimientos y comprobantes. No se puede deshacer.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteContact(id);
      if (!result.ok) alert(result.message);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={`Eliminar a ${name}`}
      className="text-on-surface-variant transition-colors hover:text-error disabled:opacity-40"
    >
      <Trash2 size={16} />
    </button>
  );
}
