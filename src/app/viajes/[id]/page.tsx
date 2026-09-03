import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, Clock, MapPin, Users, Wallet } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { createClient } from "@/lib/supabase/server";
import { TripCover } from "@/components/ui/TripCover";
import { formatScheduleDay, formatAmount } from "@/lib/format";
import { groupScheduleByDay, parseSchedule } from "@/lib/trip-schedule";
import { tripTypeLabel } from "@/lib/trip-type";
import { formatTripHours, tripCategoryLabel } from "@/lib/trip-fields";
import { getSiteContent } from "@/lib/site-content";

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
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-CL", {
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
      "id, title, description, location, start_date, end_date, capacity, price, deposit_amount, status, image_url, type, schedule, terms, category, start_time, end_time, venue_type, includes"
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
  const schedule = groupScheduleByDay(parseSchedule(trip.schedule));
  const hours = formatTripHours(trip.start_time, trip.end_time);
  const categoria = tripCategoryLabel(trip.category);
  const content = await getSiteContent();
  // Una sola politica para todas las experiencias (decision del 03/09): vive en
  // /admin/multimedia y no en `trips`. Vacia = la seccion no se dibuja.
  const cancelacion = content("condiciones.cancelacion").trim();

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
    // Las horas van pegadas a las fechas y no como dato aparte: "11:00 a 21:00"
    // sin fecha no dice nada, y en una Sesion de un dia es la mitad del dato.
    ...(hours ? [{ icon: Clock, label: "Horario", value: hours }] : []),
    ...(trip.location
      ? [
          {
            icon: MapPin,
            label: "Lugar",
            // El tipo de establecimiento acompaña a la ciudad: "Casa de retiro ·
            // Guangualí, Los Vilos, Chile". La direccion exacta NO sale aca.
            value: trip.venue_type
              ? `${trip.venue_type} · ${trip.location}`
              : trip.location,
          },
        ]
      : []),
    { icon: Users, label: "Cupo", value: `${trip.capacity} personas` },
    ...(categoria ? [{ icon: Users, label: "Dirigido a", value: categoria }] : []),
    {
      icon: Wallet,
      label: "Aporte",
      value: trip.price > 0 ? formatAmount(trip.price) : "A confirmar",
    },
  ];

  return (
    <>
      <Header />
      <main className="pt-18 md:pt-24 min-h-screen">
        <div className="px-5 max-w-5xl mx-auto py-10 md:py-16">
          <Link
            href="/viajes"
            className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Todos los viajes
          </Link>

          <TripCover
            tripId={trip.id}
            imageUrl={trip.image_url}
            variant="banner"
            priority
            className="rounded-3xl glass-card mb-10"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-void-black via-void-black/40 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-10 z-20">
              <div className="mb-3 sm:mb-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest inline-block backdrop-blur-md bg-primary-container/90 text-on-primary">
                  {tripTypeLabel(trip.type)}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest inline-block backdrop-blur-md border ${
                    STATUS_CLASS[trip.status] ?? ""
                  }`}
                >
                  {STATUS_LABEL[trip.status] ?? trip.status}
                </span>
              </div>
              <h1 className="font-display text-[26px] sm:text-[32px] md:text-[48px] leading-tight font-medium text-white text-shadow-glow text-balance">
                {trip.title}
              </h1>
              {trip.location && (
                <p className="text-on-surface-variant mt-2">{trip.location}</p>
              )}
            </div>
          </TripCover>

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
                  Escríbenos si quieres saber más.
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

              {/* El "Programa": en una ceremonia es la grilla hora + actividad
                  del flyer; en un retiro va agrupado por jornada (Dia 1, Dia 2...),
                  con la fecha derivada de la fecha de inicio. Sin actividades
                  cargadas no se muestra nada. */}
              {schedule.length > 0 && (
                <section className="mt-12">
                  <h2 className="font-display text-2xl text-primary-fixed-dim mb-5">
                    Programa
                  </h2>
                  <div className="flex flex-col gap-4">
                    {schedule.map((group) => (
                      <div key={group.day ?? "sin-jornada"}>
                        {group.day !== null && (
                          <h3 className="mb-2 flex items-baseline gap-2 text-label-sm uppercase tracking-[0.12em] text-primary-fixed-dim">
                            Día {group.day}
                            <span className="normal-case tracking-normal text-on-surface-variant/70">
                              {formatScheduleDay(trip.start_date, group.day)}
                            </span>
                          </h3>
                        )}
                        <ol className="glass-card rounded-2xl px-5 py-2 sm:px-6">
                          {group.items.map((item, i) => (
                            <li
                              key={`${item.time}-${i}`}
                              className="flex items-baseline gap-4 border-b border-primary-fixed-dim/20 py-4 last:border-b-0 sm:gap-6"
                            >
                              <span className="font-display text-lg sm:text-xl text-primary-fixed-dim tabular-nums shrink-0 w-16">
                                {item.time}
                              </span>
                              <span className="text-on-surface leading-snug">
                                {item.activity}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                </section>
              )}
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
                    Mira el resto del calendario para encontrar la próxima
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

              {/* Aporte + condiciones, como el pie del flyer. El cobro no pasa
                  por la web: esto informa, no reserva. */}
              {(trip.price > 0 || trip.terms) && (
                <div className="mt-6 border-t border-primary-fixed-dim/20 pt-5">
                  {trip.price > 0 && (
                    <>
                      <p className="font-display text-2xl text-primary-fixed-dim">
                        {formatAmount(trip.price)}
                      </p>
                      {/* La seña se anuncia acá, antes de postularse: es parte
                          de decidir si uno puede. Que exista la opción sale de
                          `deposit_amount`; si el viaje se paga completo, esta
                          línea no aparece. */}
                      {trip.deposit_amount && (
                        <p className="mt-1 text-sm text-on-surface-variant">
                          o reservá tu cupo con {formatAmount(trip.deposit_amount)}
                        </p>
                      )}
                    </>
                  )}
                  {trip.terms && (
                    <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                      {trip.terms}
                    </p>
                  )}
                </div>
              )}

              {/* "Que incluye" es propio del Viaje: en una Sesion de un dia no
                  hay alojamiento ni traslados que enumerar, y por eso el
                  formulario del panel ni siquiera muestra el campo. */}
              {trip.includes && (
                <div className="mt-6 border-t border-primary-fixed-dim/20 pt-5">
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                    Qué incluye
                  </p>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-on-surface">
                    {trip.includes}
                  </p>
                </div>
              )}

              {cancelacion && (
                <div className="mt-6 border-t border-primary-fixed-dim/20 pt-5">
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                    Cancelaciones
                  </p>
                  <p className="whitespace-pre-line text-xs leading-relaxed text-on-surface-variant">
                    {cancelacion}
                  </p>
                </div>
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
