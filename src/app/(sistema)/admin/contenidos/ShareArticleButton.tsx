"use client";

import { useState, useTransition } from "react";
import { shareArticle, unshareArticle } from "./actions";

/**
 * "Compartir": genera el link de un contenido y lo copia. Quien lo recibe lo
 * lee entero sin cuenta, aunque sea de `programa` o esté en borrador (pedido de
 * la organización, 08/10). La página es `/compartido/<token>`.
 *
 * El link se arma con el dominio desde el que se abrió el panel, así sale bien
 * en producción, en el `vercel.app` y en local sin depender de una env var.
 */
export function ShareArticleButton({
  id,
  initialToken,
}: {
  id: string;
  initialToken: string | null;
}) {
  const [token, setToken] = useState(initialToken);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // El link se arma en el click y no en el render: el componente también se
  // dibuja en el servidor, donde no hay `window`.
  const linkFor = (t: string) => `${window.location.origin}/compartido/${t}`;

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
              const result = await shareArticle(id);
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
        {message && <span className="text-xs text-on-surface-variant">{message}</span>}
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
              const result = await unshareArticle(id);
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
