import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, Clock, MapPin, Users, Wallet } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { createClient } from "@/lib/supabase/server";
import { tripPlaceholderImage } from "@/lib/constants";

type Props = { params: Promise<{ id: string }> };

const STATUS_LABEL: Record<string, string> = {
  open: "Cupos disponibles",
  closed: "Cupo completo",
  completed: "Finalizado",
};

const STATUS_CLASS: Record<string, string> = {
  open: "bg-secondary/20 text-secondary border-secondary/40",
  closed: "bg-outline-variant/40 text-on-surface-variant border-outline/40",
  completed: "bg-primary-container/20 text-primary-fixed-dim border-primary-fixed-dim/40",
};

// Postgres `date` llega como "YYYY-MM-DD": parsear y formatear en UTC evita que
// el timezone local corra la fecha un dia hacia atras.
function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDateRange(startDate: string, endDate: string) {
  return startDate === endDate
    ? formatDate(startDate)
    : `${formatDate(startDate)} — ${formatDate(endDate)}`;
}

function nightsLabel(startDate: string, endDate: string) {
  const ms =
    new Date(`${endDate}T00:00:00Z`).getTime() -
    new Date(`${startDate}T00:00:00Z`).getTime();
  const days = Math.round(ms / 86_400_000) + 1;
  return days === 1 ? "1 día" : `${days} días`;
}

async function getTrip(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trips")
    .select(
      "id, title, description, location, start_date, end_date, capacity, price, status, image_url"
    )
    .eq("id", id)
    .single();

  // Los borradores son visibles por RLS pero no deben tener pagina publica.
  if (!data || data.status === "draft") return null;
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const trip = await getTrip(id);

  if (!trip) return { title: "Viaje no encontrado" };

  return {
    title: `${trip.title} | Cosmic Eagle Journey`,
    description:
      trip.description ??
      `${trip.title} — ${trip.location ?? ""} · ${formatDateRange(trip.start_date, trip.end_date)}`,
  };
}

export default async function ViajePage({ params }: Props) {
  const { id } = await params;
  const trip = await getTrip(id);

  if (!trip) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const solicitarHref = `/viajes/${trip.id}/solicitar`;
  const isOpen = trip.status === "open";

  const details = [
    {
      icon: CalendarDays,
      label: "Fechas",
      value: formatDateRange(trip.start_date, trip.end_date),
    },
    {
      icon: Clock,
      label: "Duración",
      value: nightsLabel(trip.start_date, trip.end_date),
    },
    ...(trip.location
      ? [{ icon: MapPin, label: "Lugar", value: trip.location }]
      : []),
    { icon: Users, label: "Cupo", value: `${trip.capacity} personas` },
    {
      icon: Wallet,
      label: "Aporte",
      value: trip.price > 0 ? `USD ${trip.price}` : "A confirmar",
    },
  ];

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen">
        <div className="px-5 max-w-5xl mx-auto py-10 md:py-16">
          <Link
            href="/viajes"
            className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Todos los viajes
          </Link>

          <div className="relative h-[240px] sm:h-[280px] md:h-[400px] rounded-3xl overflow-hidden glass-card mb-10">
            <div className="absolute inset-0 bg-gradient-to-t from-void-black via-void-black/40 to-transparent z-10" />
            <img
              src={trip.image_url ?? tripPlaceholderImage(trip.id)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-10 z-20">
              <span
                className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest mb-3 sm:mb-4 inline-block backdrop-blur-md border ${
                  STATUS_CLASS[trip.status] ?? ""
                }`}
              >
                {STATUS_LABEL[trip.status] ?? trip.status}
              </span>
              <h1 className="font-display text-[26px] sm:text-[32px] md:text-[48px] leading-tight font-medium text-white text-shadow-glow text-balance">
                {trip.title}
              </h1>
              {trip.location && (
                <p className="text-on-surface-variant mt-2">{trip.location}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
            <div>
              <h2 className="font-display text-2xl text-primary-fixed-dim mb-4">
                Sobre este viaje
              </h2>
              {trip.description ? (
                <div className="text-on-surface-variant leading-relaxed space-y-4">
                  {trip.description.split("\n").filter(Boolean).map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="text-on-surface-variant">
                  Pronto vamos a compartir más detalles sobre esta experiencia.
                  Escribinos si querés saber más.
                </p>
              )}

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
                {details.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="glass-card rounded-2xl p-4">
                    <dt className="flex items-center gap-2 text-xs uppercase tracking-widest text-on-surface-variant mb-1.5">
                      <Icon size={14} className="text-secondary" />
                      {label}
                    </dt>
                    <dd className="text-on-surface">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <aside className="glass-card rounded-2xl p-6 lg:sticky lg:top-24">
              {!isOpen ? (
                <>
                  <h2 className="font-display text-xl text-primary-fixed-dim mb-2">
                    {trip.status === "completed"
                      ? "Este viaje ya finalizó"
                      : "Inscripciones cerradas"}
                  </h2>
                  <p className="text-on-surface-variant text-sm mb-5">
                    Mirá el resto del calendario para encontrar la próxima
                    fecha disponible.
                  </p>
                  <Link
                    href="/viajes"
                    className="block text-center border border-primary-fixed-dim/40 text-primary-fixed-dim text-sm font-medium tracking-[0.05em] rounded-lg px-4 py-3 hover:bg-primary-container/10 transition-colors"
                  >
                    Ver otros viajes
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="font-display text-xl text-primary-fixed-dim mb-2">
                    Postularte a este viaje
                  </h2>
                  <p className="text-on-surface-variant text-sm mb-5">
                    La participación se define a través de una solicitud con
                    unas preguntas de salud. Nuestro equipo la revisa y te
                    responde.
                  </p>
                  <Link
                    href={
                      user
                        ? solicitarHref
                        : `/cuenta?next=${encodeURIComponent(solicitarHref)}`
                    }
                    className="block text-center bg-primary-container text-on-primary text-sm font-medium tracking-[0.05em] rounded-lg px-4 py-3 hover:bg-primary-fixed transition-colors"
                  >
                    {user ? "Completar solicitud" : "Iniciar sesión y postularme"}
                  </Link>
                  {!user && (
                    <p className="text-on-surface-variant text-xs mt-4 text-center">
                      Necesitás una cuenta para postularte.{" "}
                      <Link
                        href={`/cuenta?modo=registro&next=${encodeURIComponent(solicitarHref)}`}
                        className="text-secondary hover:underline"
                      >
                        Crear cuenta
                      </Link>
                    </p>
                  )}
                </>
              )}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
