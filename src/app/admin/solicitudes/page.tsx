import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";

const STATUS_LABEL: Record<string, string> = {
  pending_review: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Expirada",
};

const STATUS_CLASS: Record<string, string> = {
  pending_review: "bg-secondary/20 text-secondary border-secondary/40",
  approved: "bg-primary-container/20 text-primary-fixed-dim border-primary-fixed-dim/40",
  rejected: "bg-error/20 text-error border-error/40",
  expired: "bg-outline-variant/30 text-on-surface-variant border-outline/40",
};

const PAYMENT_LABEL: Record<string, string> = {
  pending: "Sin pagar",
  paid: "Pagado",
  waived: "Sin cargo",
};

const FILTERS: { value: string; label: string }[] = [
  { value: "pending_review", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
  { value: "expired", label: "Expiradas" },
  { value: "all", label: "Todas" },
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminSolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status = statusParam ?? "pending_review";

  const supabase = await createClient();

  let query = supabase
    .from("applications")
    .select(
      "id, full_name, status, payment_status, previous_ceremonies, created_at, trip_id, trips(title)"
    )
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status as Enums<"application_status">);
  }

  const { data: applications } = await query;

  return (
    <div>
      <h1 className="font-display text-3xl text-primary-fixed-dim mb-6">Solicitudes</h1>

      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/solicitudes?status=${f.value}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-[0.02em] border transition-colors ${
              status === f.value
                ? "bg-primary-container/20 text-primary-fixed-dim border-primary-fixed-dim/40"
                : "text-on-surface-variant border-outline-variant hover:text-on-surface"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {!applications || applications.length === 0 ? (
        <p className="text-on-surface-variant">No hay solicitudes en este estado.</p>
      ) : (
        <div className="glass-card rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-left text-on-surface-variant">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Viaje</th>
                <th className="px-5 py-3 font-medium">Experiencia</th>
                <th className="px-5 py-3 font-medium">Pago</th>
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium text-right">Ver</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr
                  key={app.id}
                  className="border-b border-outline-variant/40 last:border-0"
                >
                  <td className="px-5 py-4 text-on-surface font-medium">
                    {app.full_name}
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant">
                    {app.trips?.title ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant">
                    {app.previous_ceremonies === 0
                      ? "Primera vez"
                      : `${app.previous_ceremonies} previas`}
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant">
                    {PAYMENT_LABEL[app.payment_status] ?? app.payment_status}
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant">
                    {formatDateTime(app.created_at)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border ${STATUS_CLASS[app.status] ?? ""}`}
                    >
                      {STATUS_LABEL[app.status] ?? app.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/solicitudes/${app.id}`}
                      className="text-secondary hover:underline"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
