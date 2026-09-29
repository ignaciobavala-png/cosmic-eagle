"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Copia la lista separada por comas, que es lo que piden los campos "Para"
 * y los importadores de las herramientas de mailing.
 */
export function CopyEmails({ emails }: { emails: string[] }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(emails.join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles (o contexto inseguro): la tabla sigue
      // estando ahi para seleccionar a mano.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-2 rounded-lg border border-primary-fixed-dim/35 px-4 py-2 text-sm text-primary-fixed-dim transition-colors hover:bg-primary-container/10"
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? "Copiados" : `Copiar ${emails.length}`}
    </button>
  );
}
