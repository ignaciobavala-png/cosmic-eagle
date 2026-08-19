import Link from "next/link";
import {
  CalendarCheck2,
  ClipboardList,
  Compass,
  Flame,
  Mail,
  UserCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TRIP_TYPES, tripAdminPath, tripTypeLabel } from "@/lib/trip-type";

const STATUS_LABEL: Record<string, string> = {
  pending_review: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  expired: "Expirada",
};

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: openRetiros },
    { count: totalRetiros },
    { count: openCeremonias },
    { count: totalCeremonias },
    { count: pendingCount },
    { count: approvedCount },
    { count: subscribers },
    { data: upcomingTrips },
    { data: recentApplications },
  ] = await Promise.all([
    supabase
      .from("trips")
      .select("*", { count: "exact", head: true })
      .eq("type", "retiro")
      .eq("status", "open"),
    supabase
      .from("trips")
      .select("*", { count: "exact", head: true })
      .eq("type", "retiro"),
    supabase
      .from("trips")
      .select("*", { count: "exact", head: true })
      .eq("type", "ceremonia")
      .eq("status", "open"),
    supabase
      .from("trips")
      .select("*", { count: "exact", head: true })
      .eq("type", "ceremonia"),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review"),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("trips")
      .select("id, title, start_date, end_date, capacity, status, type")
      .in("status", ["open", "closed"])
      .order("start_date", { ascending: true })
      .limit(4),
    supabase
      .from("applications")
      .select("id, full_name, previous_ceremonies, created_at, trips(title)")
      .eq("status", "pending_review")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    {
      href: TRIP_TYPES.retiro.adminPath,
      label: "Retiros activos",
      value: openRetiros ?? 0,
      hint: `${totalRetiros ?? 0} en total`,
      icon: Compass,
    },
    {
      href: TRIP_TYPES.ceremonia.adminPath,
      label: "Ceremonias activas",
      value: openCeremonias ?? 0,
      hint: `${totalCeremonias ?? 0} en total`,
      icon: Flame,
    },
    {
      href: "/admin/solicitudes?status=pending_review",
      label: "Solicitudes pendientes",
      value: pendingCount ?? 0,
      hint: "esperando revisión",
      icon: ClipboardList,
      highlight: (pendingCount ?? 0) > 0,
    },
    {
      href: "/admin/solicitudes?status=approved",
      label: "Aprobaciones vigentes",
      value: approvedCount ?? 0,
      hint: "acceso al panel de viajero",
      icon: UserCheck,
    },
    {
      href: "/admin/suscriptores",
      label: "Suscriptores",
      value: subscribers ?? 0,
      hint: "newsletter del footer",
      icon: Mail,
    },
    {
      href: upcomingTrips?.[0]
        ? tripAdminPath(upcomingTrips[0].type)
        : TRIP_TYPES.retiro.adminPath,
      label: "Próximo viaje",
      value: upcomingTrips?.[0] ? formatDate(upcomingTrips[0].start_date) : "—",
      hint: upcomingTrips?.[0]?.title ?? "sin viajes programados",
      icon: CalendarCheck2,
      isText: true,
    },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-primary-fixed-dim mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {stats.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className={`glass-card rounded-2xl p-6 block hover:border-primary-fixed-dim/40 transition-colors ${
                card.highlight ? "border-secondary/40" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-on-surface-variant tracking-[0.05em] uppercase">
                  {card.label}
                </p>
                <Icon size={18} className="text-secondary shrink-0" />
              </div>
              <p
                className={`font-display text-primary-fixed-dim mb-1 ${
                  card.isText ? "text-xl leading-tight" : "text-4xl"
                }`}
              >
                {card.value}
              </p>
              <p className="text-xs text-on-surface-variant truncate">
                {card.hint}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-primary-fixed-dim">
              Solicitudes recientes
            </h2>
            <Link
              href="/admin/solicitudes"
              className="text-xs text-secondary hover:underline"
            >
              Ver todas
            </Link>
          </div>

          {!recentApplications || recentApplications.length === 0 ? (
            <p className="text-on-surface-variant text-sm">
              No hay solicitudes pendientes.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-outline-variant/40">
              {recentApplications.map((app) => (
                <li key={app.id} className="py-3">
                  <Link
                    href={`/admin/solicitudes/${app.id}`}
                    className="flex items-center justify-between gap-4 group"
                  >
                    <div className="min-w-0">
                      <p className="text-on-surface font-medium truncate group-hover:text-primary-fixed-dim transition-colors">
                        {app.full_name}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {app.trips?.title ?? "—"} ·{" "}
                        {app.previous_ceremonies === 0
                          ? "primera vez"
                          : `${app.previous_ceremonies} previas`}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-secondary shrink-0">
                      {STATUS_LABEL.pending_review}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-primary-fixed-dim">
              Próximos viajes
            </h2>
            <div className="flex items-center gap-3">
              <Link
                href={TRIP_TYPES.retiro.adminPath}
                className="text-xs text-secondary hover:underline"
              >
                Retiros
              </Link>
              <Link
                href={TRIP_TYPES.ceremonia.adminPath}
                className="text-xs text-secondary hover:underline"
              >
                Ceremonias
              </Link>
            </div>
          </div>

          {!upcomingTrips || upcomingTrips.length === 0 ? (
            <p className="text-on-surface-variant text-sm">
              No hay viajes publicados.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-outline-variant/40">
              {upcomingTrips.map((trip) => (
                <li key={trip.id} className="py-3">
                  <Link
                    href={`/admin/viajes/${trip.id}/editar`}
                    className="flex items-center justify-between gap-4 group"
                  >
                    <div className="min-w-0">
                      <p className="text-on-surface font-medium truncate group-hover:text-primary-fixed-dim transition-colors">
                        {trip.title}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {tripTypeLabel(trip.type)} ·{" "}
                        {trip.start_date === trip.end_date
                          ? formatDate(trip.start_date)
                          : `${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}`}
                      </p>
                    </div>
                    <span className="text-xs text-on-surface-variant shrink-0">
                      cupo {trip.capacity}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
