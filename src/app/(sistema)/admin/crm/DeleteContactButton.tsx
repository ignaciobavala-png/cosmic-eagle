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
      className="flex items-center gap-1.5 rounded-lg border border-error/40 px-2.5 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10 disabled:opacity-40"
    >
      <Trash2 size={15} aria-hidden="true" />
      Eliminar
    </button>
  );
}
