"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { ContactFilters } from "@/lib/crm";
import { SendEmailPanel } from "./SendEmailPanel";
import { DeleteContactButton } from "./DeleteContactButton";
import { deleteContacts } from "./actions";

export type CrmRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  isAdmin: boolean;
  country: string | null;
  gender: string | null;
  experience: string;
  ceremonies: number;
  stateLabel: string;
  stateClass: string;
  /** Lo que hay que hacer con la persona ("Revisar solicitud"), o `null`. */
  actionLabel: string | null;
  /** Cómo va el pago de lo aprobado ("Pago pendiente"), o `null` sin reserva. */
  paymentLabel: string | null;
  paymentClass: string;
  createdAt: string;
};

/**
 * La tabla del CRM con selección. Sin nada tildado, el correo va a **todo el
 * grupo que muestra el filtro**; con personas tildadas, sólo a ellas. Las
 * cuentas de administración no se tildan: no reciben ni se eliminan desde acá.
 */
export function CrmTable({
  rows,
  filters,
  groupLabel,
  max,
}: {
  rows: CrmRow[];
  filters: ContactFilters;
  groupLabel: string;
  max: number;
}) {
  const selectable = rows.filter((r) => !r.isAdmin);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const allSelected = selectable.length > 0 && selected.size === selectable.length;
  const ids = [...selected];
  const mailable = (list: CrmRow[]) => list.filter((r) => r.email).length;
  const count = selected.size > 0
    ? mailable(selectable.filter((r) => selected.has(r.id)))
    : mailable(selectable);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function removeSelected() {
    if (
      !confirm(
        `¿Eliminar a ${selected.size} ${selected.size === 1 ? "persona" : "personas"}?\n\nSe borran sus cuentas y todo lo suyo: solicitudes, formularios de salud, consentimientos y comprobantes. No se puede deshacer.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteContacts(ids);
      setMessage({ ok: res.ok, text: res.message });
      setSelected(new Set());
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <p className="text-sm text-on-surface-variant">
          {selected.size > 0
            ? `${selected.size} ${selected.size === 1 ? "persona tildada" : "personas tildadas"}`
            : "Tilda personas para escribirles o eliminarlas; sin tildar, el correo va a todo el grupo."}
        </p>
        {selected.size > 0 && (
          <>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs text-on-surface-variant underline hover:text-on-surface"
            >
              Quitar selección
            </button>
            <button
              type="button"
              onClick={removeSelected}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-lg border border-error/50 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10 disabled:opacity-40"
            >
              <Trash2 size={14} />
              {pending ? "Eliminando…" : "Eliminar tildadas"}
            </button>
          </>
        )}
        {message && (
          <p
            role={message.ok ? "status" : "alert"}
            className={`text-sm ${message.ok ? "text-secondary" : "text-error"}`}
          >
            {message.text}
          </p>
        )}
      </div>

      <div className="mb-8">
        <SendEmailPanel
          key={`${groupLabel}-${selected.size > 0}`}
          filters={filters}
          ids={selected.size > 0 ? ids : undefined}
          count={count}
          max={max}
          groupLabel={groupLabel}
        />
      </div>

      <div className="glass-card overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[60rem] text-sm">
          <thead>
            <tr className="border-b border-outline-variant text-left text-on-surface-variant">
              <th className="w-10 px-5 py-3">
                <input
                  type="checkbox"
                  aria-label="Tildar a todas las personas de la lista"
                  checked={allSelected}
                  disabled={selectable.length === 0}
                  onChange={() =>
                    setSelected(allSelected ? new Set() : new Set(selectable.map((r) => r.id)))
                  }
                />
              </th>
              <th className="px-5 py-3 font-medium">Persona</th>
              <th className="px-5 py-3 font-medium">País</th>
              <th className="px-5 py-3 font-medium">Género</th>
              <th className="px-5 py-3 font-medium">Experiencia</th>
              <th className="px-5 py-3 font-medium">Ceremonias</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Registro</th>
              <th className="px-5 py-3 font-medium sr-only">Ficha</th>
              <th className="sticky right-0 bg-surface-container px-5 py-3 font-medium">
                Eliminar
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((contact) => (
              <tr
                key={contact.id}
                className="border-b border-outline-variant/40 last:border-0"
              >
                <td className="px-5 py-4">
                  {!contact.isAdmin && (
                    <input
                      type="checkbox"
                      aria-label={`Tildar a ${contact.fullName ?? contact.email ?? "esta persona"}`}
                      checked={selected.has(contact.id)}
                      onChange={() => toggle(contact.id)}
                    />
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-outline/40 font-display text-sm text-on-surface-variant"
                    >
                      {(contact.fullName?.trim()?.[0] ?? contact.email?.[0] ?? "?").toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-on-surface">
                        {contact.fullName ?? "Sin nombre"}
                        {contact.isAdmin && (
                          <span className="ml-2 text-[10px] uppercase tracking-widest text-primary-fixed-dim">
                            admin
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-on-surface-variant">
                        {contact.email ?? "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-on-surface-variant">{contact.country ?? "—"}</td>
                <td className="px-5 py-4 text-on-surface-variant">{contact.gender ?? "—"}</td>
                <td className="px-5 py-4 text-on-surface-variant">{contact.experience}</td>
                <td className="px-5 py-4 text-on-surface-variant">{contact.ceremonies}</td>
                <td className="px-5 py-4">
                  {/* El estado, y debajo lo que falta: qué hacer o cómo va el
                      pago. Van en la misma celda para que se lean juntos y la
                      tabla no gane una columna que tape al resto. */}
                  <div className="flex flex-col items-start gap-1.5">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${contact.stateClass}`}
                    >
                      {contact.stateLabel}
                    </span>
                    {contact.actionLabel && (
                      <Link
                        href={`/admin/crm/${contact.id}`}
                        className="whitespace-nowrap rounded-full border border-primary-fixed-dim bg-primary-container/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-fixed-dim transition-colors hover:bg-primary-container/40"
                      >
                        {contact.actionLabel} →
                      </Link>
                    )}
                    {contact.paymentLabel && (
                      <span
                        className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${contact.paymentClass}`}
                      >
                        {contact.paymentLabel}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-on-surface-variant">{contact.createdAt}</td>
                <td className="px-5 py-4">
                  <Link
                    href={`/admin/crm/${contact.id}`}
                    className="whitespace-nowrap text-xs text-on-surface-variant transition-colors hover:text-primary-fixed-dim"
                  >
                    Abrir ficha →
                  </Link>
                </td>
                <td className="sticky right-0 bg-surface-container px-5 py-4">
                  {contact.isAdmin ? (
                    <span className="text-xs text-on-surface-variant/60" title="Las cuentas de administración no se eliminan desde acá">
                      —
                    </span>
                  ) : (
                    <DeleteContactButton
                      id={contact.id}
                      name={contact.fullName ?? contact.email ?? "esta persona"}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
