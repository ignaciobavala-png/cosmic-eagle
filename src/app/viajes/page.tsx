import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { createClient } from "@/lib/supabase/server";
import { tripPlaceholderImage } from "@/lib/constants";

const STATUS_LABEL: Record<string, string> = {
  open: "Cupos disponibles",
  closed: "Cupo completo",
  completed: "Finalizado",
};

function formatDateRange(startDate: string, endDate: string) {
  // Postgres `date` llega como "YYYY-MM-DD": parsear como UTC y formatear en
  // UTC evita que el timezone local corra la fecha un dia hacia atras.
  const format = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  return startDate === endDate
    ? format(startDate)
    : `${format(startDate)} — ${format(endDate)}`;
}

export default async function ViajesPage() {
  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("id, title, description, location, start_date, end_date, price, status")
    .in("status", ["open", "closed"])
    .order("start_date", { ascending: true });

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen">
        <div className="px-5 max-w-7xl mx-auto py-16 md:py-20">
          <div className="text-center mb-12">
            <span className="text-xs font-medium tracking-[0.05em] uppercase text-secondary block mb-2">
              Calendario de viajes
            </span>
            <h1 className="font-display text-[32px] md:text-[40px] font-medium text-primary">
              Próximos Viajes y Ceremonias
            </h1>
          </div>

          {!trips || trips.length === 0 ? (
            <p className="text-on-surface-variant text-center max-w-md mx-auto">
              No hay viajes publicados por el momento. Volvé a visitarnos
              pronto.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/viajes/${trip.id}`}
                  className="group relative h-[420px] rounded-3xl overflow-hidden glass-card block"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-void-black via-void-black/30 to-transparent z-10" />
                  <img
                    src={tripPlaceholderImage(trip.id)}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest mb-4 inline-block backdrop-blur-md border ${
                        trip.status === "open"
                          ? "bg-secondary/20 text-secondary border-secondary/40"
                          : "bg-outline-variant/40 text-on-surface-variant border-outline/40"
                      }`}
                    >
                      {STATUS_LABEL[trip.status] ?? trip.status}
                    </span>
                    <h2 className="font-display text-2xl md:text-[32px] leading-[40px] text-white mb-2">
                      {trip.title}
                    </h2>
                    <p className="text-on-surface-variant text-sm mb-1">
                      {trip.location} · {formatDateRange(trip.start_date, trip.end_date)}
                    </p>
                    {trip.description && (
                      <p className="text-on-surface-variant max-w-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 mb-3">
                        {trip.description}
                      </p>
                    )}
                    <span className="inline-block bg-primary text-on-primary text-sm font-medium tracking-[0.05em] rounded-lg px-4 py-2 group-hover:bg-primary-container transition-colors">
                      Ver viaje
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
