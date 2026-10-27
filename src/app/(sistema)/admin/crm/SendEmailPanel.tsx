"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import type { ContactFilters } from "@/lib/crm";
import { CRM_TEMPLATE_NUEVAS_FECHAS } from "@/lib/email/crm-templates";
import { sendSegmentedEmail, type SendResultState } from "./actions";

/**
 * Redactor de correo para el grupo que muestra el filtro del CRM. Solo manda
 * los filtros: quién recibe lo decide el servidor (ver `sendSegmentedEmail`).
 */
export function SendEmailPanel({
  filters,
  count,
  max,
  groupLabel,
}: {
  filters: ContactFilters;
  count: number;
  max: number;
  groupLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<SendResultState | null>(null);
  const [pending, startTransition] = useTransition();

  const field =
    "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary-fixed-dim focus:outline-none";

  function send() {
    if (
      !confirm(
        `Se va a enviar este correo a ${count} ${count === 1 ? "persona" : "personas"} (${groupLabel}). ¿Enviar?`
      )
    ) {
      return;
    }
    setResult(null);
    startTransition(async () => {
      const res = await sendSegmentedEmail(filters, subject, message);
      setResult(res);
      if (res.ok) {
        setSubject("");
        setMessage("");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={count === 0}
        className="flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-40"
      >
        <Mail size={16} />
        Enviar correo a {count}
      </button>
    );
  }

  return (
    <section className="glass-card mb-8 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg text-primary-fixed-dim">
            Enviar correo a {count} {count === 1 ? "persona" : "personas"}
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Grupo: {groupLabel}. Cada persona recibe el correo con su nombre y no
            ve a las demás.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-on-surface-variant hover:text-on-surface"
        >
          Cerrar
        </button>
      </div>

      {count > max && (
        <p className="mt-3 text-sm text-error" role="alert">
          El máximo por envío es {max}. Afina el filtro para poder enviar.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            if (
              (subject.trim() || message.trim()) &&
              !confirm("Esto reemplaza lo que ya escribiste. ¿Seguir?")
            ) {
              return;
            }
            setSubject(CRM_TEMPLATE_NUEVAS_FECHAS.subject);
            setMessage(CRM_TEMPLATE_NUEVAS_FECHAS.message);
          }}
          className="self-start rounded-lg border border-outline-variant px-3 py-1.5 text-xs text-on-surface-variant hover:text-on-surface"
        >
          Usar texto: {CRM_TEMPLATE_NUEVAS_FECHAS.label}
        </button>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Asunto"
          maxLength={150}
          className={field}
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe el mensaje. Los saltos de línea se respetan."
          rows={8}
          className={field}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={send}
          disabled={pending || count === 0 || count > max || !subject.trim() || !message.trim()}
          className="rounded-lg bg-primary-container px-5 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-40"
        >
          {pending ? "Enviando…" : "Enviar"}
        </button>
        {result && (
          <p
            role={result.ok ? "status" : "alert"}
            className={`text-sm ${result.ok ? "text-secondary" : "text-error"}`}
          >
            {result.message}
          </p>
        )}
      </div>
    </section>
  );
}
