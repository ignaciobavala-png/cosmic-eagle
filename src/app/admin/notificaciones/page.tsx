import Link from "next/link";
import { AlertTriangle, Inbox, MailWarning, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";
import { MarkAllReadButton, MarkReadButton } from "./MarkReadButtons";

/**
 * Casilla de avisos internos. Responde el paso 4 del flujo de inscripción de
 * Sofía: "generar un aviso interno para revisión" cuando una solicitud declara
 * salud a revisar (ver docs/FLUJO_INSCRIPCION.md).
 */

const KIND: Record<
  Enums<"admin_notification_kind">,
  { label: string; icon: typeof Inbox; className: string }
> = {
  application_new: {
    label: "Solicitud nueva",
    icon: UserPlus,
    className: "text-primary-fixed-dim border-primary-fixed-dim/30 bg-primary-container/10",
  },
  application_health_flag: {
    label: "Revisión manual",
    icon: AlertTriangle,
    className: "text-error border-error/40 bg-error/10",
  },
  email_failed: {
    label: "Mail no enviado",
    icon: MailWarning,
    className: "text-error border-error/40 bg-error/10",
  },
};

const FILTERS = [
  { value: "sin_leer", label: "Sin leer" },
  { value: "todas", label: "Todas" },
];

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function NotificacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro: filtroParam } = await searchParams;
  const filtro = filtroParam === "todas" ? "todas" : "sin_leer";

  const supabase = await createClient();

  let query = supabase
    .from("admin_notifications")
    .select("id, kind, title, body, href, created_at, read_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filtro === "sin_leer") query = query.is("read_at", null);

  const [{ data: notifications }, { count: unread }] = await Promise.all([
    query,
    supabase
      .from("admin_notifications")
      .select("*", { count: "exact", head: true })
      .is("read_at", null),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-3xl text-primary-fixed-dim">Notificaciones</h1>
        {(unread ?? 0) > 0 && <MarkAllReadButton />}
      </div>

      <div className="flex items-center gap-2 mb-6">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/notificaciones?filtro=${f.value}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium tracking-[0.02em] transition-colors ${
              filtro === f.value
                ? "text-primary-fixed-dim bg-primary-container/10"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {f.label}
            {f.value === "sin_leer" && (unread ?? 0) > 0 ? ` (${unread})` : ""}
          </Link>
        ))}
      </div>

      {!notifications?.length ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <Inbox size={28} className="mx-auto mb-3 text-on-surface-variant" />
          <p className="text-on-surface-variant">
            {filtro === "sin_leer"
              ? "No hay avisos sin leer."
              : "Todavía no hay avisos."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => {
            const kind = KIND[n.kind];
            const Icon = kind.icon;
            return (
              <li
                key={n.id}
                className={`glass-card rounded-2xl p-5 ${
                  n.read_at ? "opacity-60" : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border ${kind.className}`}
                  >
                    <Icon size={12} />
                    {kind.label}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {formatWhen(n.created_at)}
                  </span>
                </div>

                <p className="text-on-surface font-medium">{n.title}</p>
                {n.body && (
                  <p className="text-sm text-on-surface-variant mt-1">{n.body}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 mt-4">
                  {n.href && (
                    <Link
                      href={n.href}
                      className="text-sm text-primary-fixed-dim hover:underline"
                    >
                      Ver solicitud →
                    </Link>
                  )}
                  {!n.read_at && <MarkReadButton id={n.id} />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
