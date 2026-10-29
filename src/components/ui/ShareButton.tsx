"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/**
 * "Compartir" de un contenido (29/10): en el teléfono abre el menú nativo de
 * compartir; donde no existe, copia el link al portapapeles. Comparte la
 * dirección pública del contenido —la que ya está en la barra—, no un link con
 * token: quien lo recibe llega al muro si su nivel no alcanza, como cualquiera.
 */
export function ShareButton({
  title,
  label,
  copiedLabel,
}: {
  title: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.origin + window.location.pathname;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Cerrar el menú sin elegir no es un fallo: no se cae al portapapeles.
        if ((error as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt(label, url);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      className="inline-flex items-center gap-2 rounded-full border border-on-primary-container/40 px-4 py-1.5 text-label-sm uppercase text-on-primary-container transition-colors hover:border-[#05125a] hover:text-[#05125a]"
    >
      {copied ? <Check size={15} aria-hidden="true" /> : <Share2 size={15} aria-hidden="true" />}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
