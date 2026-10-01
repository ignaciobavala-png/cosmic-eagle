import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, Clock, MapPin, Users, Wallet } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/ui/PageHero";
import { CreamSection, CREAM_HEX } from "@/components/ui/CreamSection";
import { CtaLink } from "@/components/ui/CtaLink";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { TitleRule } from "@/components/ui/TitleRule";
import { tripPlaceholderImage } from "@/lib/constants";
import {
  formatScheduleDay,
  formatAmount,
  type FormatLocale,
} from "@/lib/format";
import {
  groupScheduleByDay,
  localizeSchedule,
  parseSchedule,
} from "@/lib/trip-schedule";
import { localizeRow } from "@/lib/localized";
import { isTripType } from "@/lib/trip-type";
import { formatTripTime, isTripCategory } from "@/lib/trip-fields";
import { getSiteContent } from "@/lib/site-content";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string; id: string }> };

// Las etiquetas viven sobre la portada del hero, o sea sobre una foto: van
// opacas y no translucidas, que es lo unico que se lee sobre cualquier imagen.
const STATUS_CLASS: Record<string, string> = {
  open: "bg-[#f9d78f] text-[#05125a]",
  closed: "bg-[#05125a]/80 text-primary-container border border-primary-container/50",
  completed: "bg-[#05125a]/80 text-primary-container border border-primary-container/50",
};

// Postgres `date` llega como "YYYY-MM-DD": parsear y formatear en UTC evita que
// el timezone local corra la fecha un dia hacia atras.
function formatDate(iso: string, locale: FormatLocale = "es") {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(
    locale === "en" ? "en-US" : "es-CL",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  );
}

function formatDateRange(
  startDate: string,
  endDate: string,
  locale: FormatLocale = "es"
) {
  return startDate === endDate
    ? formatDate(startDate, locale)
    : `${formatDate(startDate, locale)} — ${formatDate(endDate, locale)}`;
}

function nightsCount(startDate: string, endDate: string) {
  const ms =
    new Date(`${endDate}T00:00:00Z`).getTime() -
    new Date(`${startDate}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

async function getTrip(id: string, locale: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trips")
    .select(
      "id, title, title_en, description, description_en, location, start_date, end_date, capacity, price, deposit_amount, status, image_url, type, schedule, terms, terms_en, category, start_time, end_time, venue_type, venue_type_en, includes, includes_en"
    )
    .eq("id", id)
    .single();

  // Los borradores son visibles por RLS pero no deben tener pagina publica.
  if (!data || data.status === "draft") return null;

  // En /en cada campo usa su `_en` si está cargado (docs/I18N.md §6).
  return localizeRow(data, locale, [
    "title",
    "description",
    "terms",
    "venue_type",
    "includes",
  ]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ViajeDetalle");
  const trip = await getTrip(id, locale);

  if (!trip) return { title: t("meta.notFound") };

  return {
    title: `${trip.title} | Cosmic Eagle Journey`,
    description:
      trip.description ??
      `${trip.title} — ${trip.location ?? ""} · ${formatDateRange(trip.start_date, trip.end_date)}`,
  };
}

export default async function ViajePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const formatLocale: FormatLocale = locale === "en" ? "en" : "es";
  const t = await getTranslations("ViajeDetalle");
  const tTrip = await getTranslations("TripTypes");
  const trip = await getTrip(id, locale);

  if (!trip) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const solicitarHref = `/viajes/${trip.id}/solicitar`;
  const isOpen = trip.status === "open";
  const schedule = groupScheduleByDay(
    localizeSchedule(parseSchedule(trip.schedule), locale)
  );
  const hourFrom = formatTripTime(trip.start_time);
  const hourTo = formatTripTime(trip.end_time);
  const hours =
    hourFrom && hourTo
      ? t("hours.range", { from: hourFrom, to: hourTo })
      : (hourFrom ?? (hourTo ? t("hours.until", { to: hourTo }) : null));
  const categoria =
    isTripCategory(trip.category) && trip.category !== "mixto"
      ? tTrip(`category.${trip.category}`)
      : null;
  const content = await getSiteContent(locale);
  // Una sola politica para todas las experiencias (decision del 03/09): vive en
  // /admin/multimedia y no en `trips`. Vacia = la seccion no se dibuja.
  const cancelacion = content("condiciones.cancelacion").trim();

  const details = [
    {
      icon: CalendarDays,
      label: t("fields.fechas"),
      value: formatDateRange(trip.start_date, trip.end_date, formatLocale),
    },
    {
      icon: Clock,
      label: t("fields.duracion"),
      value: t("nights", {
        count: nightsCount(trip.start_date, trip.end_date),
      }),
    },
    // Las horas van pegadas a las fechas y no como dato aparte: "11:00 a 21:00"
    // sin fecha no dice nada, y en una Sesion de un dia es la mitad del dato.
    ...(hours ? [{ icon: Clock, label: t("fields.horario"), value: hours }] : []),
    ...(trip.location
      ? [
          {
            icon: MapPin,
            label: t("fields.lugar"),
            // El tipo de establecimiento acompaña a la ciudad: "Casa de retiro ·
            // Guangualí, Los Vilos, Chile". La direccion exacta NO sale aca.
            value: trip.venue_type
              ? `${trip.venue_type} · ${trip.location}`
              : trip.location,
          },
        ]
      : []),
    {
      icon: Users,
      label: t("fields.cupo"),
      value: t("capacity", { count: trip.capacity }),
    },
    ...(categoria
      ? [{ icon: Users, label: t("fields.dirigidoA"), value: categoria }]
      : []),
    {
      icon: Wallet,
      label: t("fields.aporte"),
      value:
        trip.price > 0
          ? formatAmount(trip.price, formatLocale)
          : t("priceConfirm"),
    },
  ];

  const tipo = isTripType(trip.type) ? tTrip(`${trip.type}.one`) : trip.type;
  const cover = trip.image_url ?? tripPlaceholderImage(trip.id);

  return (
    <>
      <Header />
      <main className="pt-[var(--navbar-h)]">
        {/* El hero es el mismo P1 del resto del sitio, con la portada del viaje
            como imagen. Antes la portada era una tarjeta redondeada adentro de
            una columna de 5xl, que es como se veian las paginas del sistema
            anterior; todas las rutas publicas del rediseño abren con la imagen
            a sangre. */}
        <PageHero
          image={cover}
          imageAlt={t("hero.portadaAlt", { title: trip.title })}
          eyebrow={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-[#f9d78f] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#05125a]">
                {tipo}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                  STATUS_CLASS[trip.status] ?? ""
                }`}
              >
                {["open", "closed", "completed"].includes(trip.status)
                  ? tTrip(`status.${trip.status}`)
                  : trip.status}
              </span>
            </div>
          }
          title={trip.title}
          subtitle={trip.location ?? undefined}
          scrollHint={t("hero.scrollHint")}
          scrollTo="detalle"
          actions={
            isOpen
              ? [
                  {
                    label: user
                      ? t("hero.postularme")
                      : t("hero.loginPostularme"),
                    href: user
                      ? solicitarHref
                      : `/cuenta?next=${encodeURIComponent(solicitarHref)}`,
                  },
                ]
              : []
          }
          fadeTo={CREAM_HEX}
        />

        <CreamSection
          id="detalle"
          full={false}
          reveal={{ amount: 0.18, once: false, stagger: 0 }}
        >
          <div className="mx-auto max-w-3xl">
            {/* La etiqueta del tipo y el titulo estaban en un mismo
                `RevealItem`. Se parten en dos con los MISMOS parametros —o sea
                que entran igual que antes— para que el `w-fit` pueda envolver
                al titulo con su filete y nada mas: si envolviera tambien a la
                etiqueta, el ancho lo mandaria la mas larga de las dos. */}
            <RevealItem y={0} duration={1}>
              <p className="mb-4 text-label-sm font-bold uppercase text-on-primary-container">
                {tipo}
              </p>
            </RevealItem>
            <div className="w-fit">
              <RevealItem y={0} duration={1}>
                <h2 className="font-display text-headline-md font-bold text-[#05125a] md:text-headline-lg">
                  {t("detail.title")}
                </h2>
              </RevealItem>
              <TitleRule grow className="mt-3 mb-7" />
            </div>

            <RevealItem y={14} duration={0.8} delay={0.15}>
              {trip.description ? (
                <div className="space-y-5 text-body-md leading-relaxed text-[#05125a] text-justify">
                  {trip.description
                    .split("\n")
                    .filter(Boolean)
                    .map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                </div>
              ) : (
                <p className="text-body-md leading-relaxed text-[#05125a]">
                  {t("detail.empty")}
                </p>
              )}
            </RevealItem>

            {/* Las fichas de datos sobre crema: tarjeta blanca con filete
                dorado. El `glass-card` de antes era vidrio dorado sobre fondo
                oscuro y sobre crema no se ve. */}
            <RevealItem y={14} duration={0.8} delay={0.3}>
              <dl className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {details.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-[#f9d78f] bg-[#fff6eb] p-4"
                  >
                    <dt className="mb-1.5 flex items-center gap-2 text-xs uppercase tracking-widest text-on-primary-container">
                      <Icon size={14} />
                      {label}
                    </dt>
                    <dd className="text-[#05125a]">{value}</dd>
                  </div>
                ))}
              </dl>
            </RevealItem>

            {/* El "Programa": en una Sesión es la grilla hora + actividad del
                flyer; en un Viaje va agrupado por jornada (Día 1, Día 2...), con
                la fecha derivada de la fecha de inicio. Sin actividades
                cargadas no se muestra nada. */}
            {schedule.length > 0 && (
              <RevealItem y={14} duration={0.8} delay={0.4}>
                <section className="mt-14">
                  <div className="w-fit">
                    <h3 className="font-display text-headline-md font-bold text-[#05125a]">
                      {t("program.title")}
                    </h3>
                    <TitleRule className="mt-3 mb-7" />
                  </div>
                  <div className="flex flex-col gap-6">
                    {schedule.map((group) => (
                      <div key={group.day ?? "sin-jornada"}>
                        {group.day !== null && (
                          <h4 className="mb-2 flex items-baseline gap-2 text-label-sm uppercase tracking-[0.12em] text-on-primary-container">
                            {t("program.day", { day: group.day })}
                            <span className="normal-case tracking-normal text-[#05125a]/70">
                              {formatScheduleDay(
                                trip.start_date,
                                group.day,
                                formatLocale
                              )}
                            </span>
                          </h4>
                        )}
                        <ol className="rounded-2xl border border-[#f9d78f] bg-[#fff6eb] px-5 py-2 sm:px-6">
                          {group.items.map((item, i) => (
                            <li
                              key={`${item.time}-${i}`}
                              className="flex items-baseline gap-4 border-b border-[#f9d78f]/50 py-4 last:border-b-0 sm:gap-6"
                            >
                              <span className="w-16 shrink-0 font-display text-lg tabular-nums text-on-primary-container sm:text-xl">
                                {item.time}
                              </span>
                              <span className="leading-snug text-[#05125a]">
                                {item.activity}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                </section>
              </RevealItem>
            )}

            {/* "Qué incluye" es propio del Viaje: en una Sesión de un día no hay
                alojamiento ni traslados que enumerar, y por eso el formulario
                del panel ni siquiera muestra el campo. */}
            {trip.includes && (
              <RevealItem y={14} duration={0.8} delay={0.5}>
                <section className="mt-14">
                  <div className="w-fit">
                    <h3 className="font-display text-headline-md font-bold text-[#05125a]">
                      {t("includes.title")}
                    </h3>
                    <TitleRule className="mt-3 mb-7" />
                  </div>
                  <p className="whitespace-pre-line text-body-md leading-relaxed text-[#05125a]">
                    {trip.includes}
                  </p>
                </section>
              </RevealItem>
            )}
          </div>
        </CreamSection>

        {/* El cierre reemplaza al panel lateral pegajoso del diseño anterior: en
            el sistema nuevo cada página remata en una banda a todo el ancho. El
            CTA no se pierde — está también arriba, en el hero. */}
        <Reveal
          as="section"
          amount={0.25}
          once={false}
          stagger={0}
          className="w-full bg-[linear-gradient(160deg,#05125a_0%,#0a1f6e_100%)] px-margin-mobile py-20 md:px-margin-desktop md:py-24"
        >
          <div className="mx-auto max-w-2xl text-center">
            {isOpen ? (
              <>
                <div className="mx-auto w-fit">
                  <RevealItem y={0} duration={1}>
                    <h2 className="font-display text-headline-md font-bold text-primary-container md:text-headline-lg">
                      {t("postulate.title")}
                    </h2>
                  </RevealItem>
                  <TitleRule align="center" grow className="mt-3 mb-7" />
                </div>

                {trip.price > 0 && (
                  <RevealItem y={14} duration={0.8} delay={0.15}>
                    <p className="font-display text-[2rem] font-bold text-white">
                      {formatAmount(trip.price, formatLocale)}
                    </p>
                    {/* La seña se anuncia acá, antes de postularse: es parte de
                        decidir si uno puede. Que exista la opción sale de
                        `deposit_amount`; si el viaje se paga completo, esta
                        línea no aparece. */}
                    {trip.deposit_amount && (
                      <p className="mt-1 text-sm text-white/70">
                        {t("postulate.deposit", {
                          amount: formatAmount(trip.deposit_amount, formatLocale),
                        })}
                      </p>
                    )}
                  </RevealItem>
                )}

                <RevealItem y={14} duration={0.8} delay={0.3}>
                  <p className="mx-auto mt-6 max-w-lg text-body-md leading-relaxed text-white/75">
                    {t("postulate.body")}
                  </p>
                  <div className="mt-8 flex justify-center">
                    <CtaLink
                      href={
                        user
                          ? solicitarHref
                          : `/cuenta?next=${encodeURIComponent(solicitarHref)}`
                      }
                    >
                      {user
                        ? t("postulate.submit")
                        : t("postulate.loginSubmit")}
                    </CtaLink>
                  </div>
                  {!user && (
                    <p className="mt-4 text-xs text-white/60">
                      {t.rich("postulate.needAccount", {
                        link: (chunks) => (
                          <Link
                            href={`/cuenta?modo=registro&next=${encodeURIComponent(solicitarHref)}`}
                            className="text-primary-container underline underline-offset-4"
                          >
                            {chunks}
                          </Link>
                        ),
                      })}
                    </p>
                  )}
                </RevealItem>
              </>
            ) : (
              <RevealItem y={0} duration={1}>
                <h2 className="font-display text-headline-md font-bold text-primary-container md:text-headline-lg">
                  {trip.status === "completed"
                    ? t("closed.completed")
                    : t("closed.closed")}
                </h2>
                <p className="mx-auto mt-5 max-w-lg text-body-md leading-relaxed text-white/75">
                  {t("closed.body")}
                </p>
                <div className="mt-8 flex justify-center">
                  <CtaLink href="/viajes">{t("closed.cta")}</CtaLink>
                </div>
              </RevealItem>
            )}

            {/* Aporte + condiciones, como el pie del flyer. El cobro no pasa por
                la web: esto informa, no reserva. */}
            {(trip.terms || cancelacion) && (
              <RevealItem y={14} duration={0.8} delay={0.45}>
                <div className="mt-12 border-t border-primary-container/25 pt-8 text-left">
                  {trip.terms && (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-white/70">
                      {trip.terms}
                    </p>
                  )}
                  {cancelacion && (
                    <>
                      <p className="mb-2 mt-6 text-xs uppercase tracking-widest text-primary-container">
                        {t("cancellations")}
                      </p>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-white/70">
                        {cancelacion}
                      </p>
                    </>
                  )}
                </div>
              </RevealItem>
            )}
          </div>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
