"use client";

import { useState, useTransition } from "react";
import { shareMaterial, unshareMaterial } from "./actions";

/**
 * "Compartir": genera el link de un documento y lo copia. Quien lo recibe lo
 * lee entero y puede guardarlo como PDF, sin cuenta. La pagina es
 * `/material/<token>` (mismo mecanismo que `ShareArticleButton`).
 *
 * El link se arma con el dominio desde el que se abrio el panel, asi sale bien
 * en produccion, en el `vercel.app` y en local sin depender de una env var.
 */
export function ShareMaterialButton({
  id,
  initialToken,
}: {
  id: string;
  initialToken: string | null;
}) {
  const [token, setToken] = useState(initialToken);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // El link se arma en el click y no en el render: el componente tambien se
  // dibuja en el servidor, donde no hay `window`.
  const linkFor = (t: string) => `${window.location.origin}/material/${t}`;

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copiado");
    } catch {
      // Sin permiso de portapapeles (http, iframe): queda el link a la vista.
      setMessage(url);
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await shareMaterial(id);
              if (result.error || !result.token) {
                setMessage("No se pudo crear el link");
                return;
              }
              setToken(result.token);
              await copy(linkFor(result.token));
            })
          }
          className="text-secondary hover:underline disabled:opacity-50"
        >
          Compartir
        </button>
        {message && (
          <span className="text-xs text-on-surface-variant">{message}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void copy(linkFor(token))}
          className="text-secondary hover:underline"
        >
          Copiar link
        </button>
        <a
          href={`/material/${token}`}
          target="_blank"
          rel="noreferrer"
          className="text-secondary hover:underline"
        >
          Abrir
        </a>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (
              !confirm(
                "¿Dejar de compartir? El link que ya mandaste deja de abrir."
              )
            ) {
              return;
            }
            startTransition(async () => {
              const result = await unshareMaterial(id);
              if (result.error) {
                setMessage("No se pudo quitar el link");
                return;
              }
              setToken(null);
              setMessage(null);
            });
          }}
          className="text-on-surface-variant hover:underline disabled:opacity-50"
        >
          Dejar de compartir
        </button>
      </div>
      <span className="max-w-56 truncate text-xs text-on-surface-variant">
        {message ?? "Compartido"}
      </span>
    </div>
  );
}
