"use client";

import { revokeContentGrant, setAccessCodeActive } from "./actions";

export function ToggleCodeButton({
  id,
  isActive,
  code,
}: {
  id: string;
  isActive: boolean;
  code: string;
}) {
  return (
    <form
      action={setAccessCodeActive.bind(null, id, !isActive)}
      onSubmit={(event) => {
        if (
          isActive &&
          !confirm(
            `¿Apagar el código ${code}? Deja de servir para entrar, pero quien ya lo canjeó conserva el acceso.`
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className={
          isActive
            ? "text-error hover:underline"
            : "text-secondary hover:underline"
        }
      >
        {isActive ? "Apagar" : "Encender"}
      </button>
    </form>
  );
}

export function RevokeGrantButton({ id, who }: { id: string; who: string }) {
  return (
    <form
      action={revokeContentGrant.bind(null, id)}
      onSubmit={(event) => {
        if (!confirm(`¿Quitarle el acceso a ${who}?`)) event.preventDefault();
      }}
    >
      <button type="submit" className="text-error hover:underline">
        Quitar
      </button>
    </form>
  );
}
