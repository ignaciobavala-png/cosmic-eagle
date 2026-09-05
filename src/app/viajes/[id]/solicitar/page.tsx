import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { createClient } from "@/lib/supabase/server";
import { getActivePaymentMethods } from "@/lib/payments";
import { formatAmount } from "@/lib/format";
import { formatTripHours } from "@/lib/trip-fields";
import {
  funnelSurface,
  panel,
  panelBody,
  panelStrong,
  panelTitle,
  pillButton,
} from "@/components/forms/styles";
import { ScreeningForm } from "./ScreeningForm";
import { PaymentProofUpload } from "./PaymentProofUpload";

type Step = { title: string; body: string; cta?: { href: string; label: string } };

/**
 * El estado que ve el postulante después de mandar el filtro corto. No es sólo
 * "en revisión / aprobada": el flujo sigue después de aprobar (pago, formulario
 * extenso, consentimiento), así que cada estado dice cuál es el paso siguiente.
 */
function nextStep(
  tripId: string,
  app: {
    status: string | null;
    payment_status: string | null;
    is_first_time: boolean | null;
    health_form_submitted: boolean | null;
    consent_submitted: boolean | null;
  }
): Step {
  if (app.status === "rejected") {
    return {
      title: "Tu solicitud no fue aprobada para este viaje",
      body: "Puedes postularte a otro viaje más adelante.",
    };
  }

  if (app.status === "expired") {
    return {
      title: "Tu aprobación para este viaje fue invalidada",
      body: "Contactanos si creés que esto es un error.",
    };
  }

  // Ni aprobada ni rechazada: hay algo que Estela quiere mirar con la persona
  // antes de decidir (correo [2A], docs/COMUNICACIONES.md). Es el único estado
  // cuyo paso siguiente no ocurre en la web, así que no lleva CTA — y no dice
  // qué hay que conversar: puede ser un dato de salud del filtro.
  if (app.status === "needs_conversation") {
    return {
      title: "Nos gustaría conversar contigo",
      body: "Hay algunos aspectos de lo que nos contaste que preferimos mirar juntos, con calma. Esto no significa que no puedas participar: te vamos a escribir para coordinar, y también podés responder el correo que te mandamos.",
    };
  }

  if (app.status !== "approved") {
    return {
      title: "Tu solicitud está en revisión",
      body: "Estela la está leyendo. Te vamos a avisar apenas tengamos una respuesta, y ahí seguimos con la reserva del cupo.",
    };
  }

  // Aprobada y sin pagar. El cobro no pasa por la web: la persona transfiere o
  // paga por fuera y sube el comprobante, y Estela confirma a mano desde el
  // panel (ver docs/PAGOS.md). Los datos del pago se dibujan abajo de esta
  // tarjeta, así que el texto no los repite.
  if (app.payment_status === "pending") {
    return {
      title: "Tu solicitud fue aprobada",
      body: "Para reservar tu cupo falta el pago. Abajo están los datos y el lugar para enviarnos el comprobante; en cuanto lo confirmemos seguimos con el formulario de salud.",
    };
  }

  // Los dos formularios que faltan, en orden: primero el de salud y después el
  // consentimiento, porque una de sus cuatro confirmaciones dice justamente que
  // el de salud está completo (docs/CONSENTIMIENTO.md).
  const faltaSalud = !!app.is_first_time && !app.health_form_submitted;
  const faltaConsentimiento = !app.consent_submitted;

  const formulario = faltaSalud
    ? {
        body: "el formulario de salud completo, que es lo que nos permite preparar la ceremonia y cuidar tu proceso",
        cta: {
          href: `/viajes/${tripId}/salud`,
          label: "Completar el formulario de salud",
        },
      }
    : faltaConsentimiento
      ? {
          body: "firmar el consentimiento informado, que explica en qué consiste la experiencia y cómo te acompañamos",
          cta: {
            href: `/viajes/${tripId}/consentimiento`,
            label: "Leer y firmar el consentimiento",
          },
        }
      : null;

  // Reservó con seña: los formularios se abren igual (así lo pide el correo
  // [3A] de Sofía — se mandan con la reserva, no con el saldo), pero la pantalla
  // tiene que seguir mostrando cuánto falta.
  if (app.payment_status === "deposit_paid") {
    return {
      title: "Cupo reservado",
      body: formulario
        ? `Recibimos tu seña y tu lugar está guardado. Abajo está el saldo y cómo completarlo, cuando quieras. Mientras tanto podés seguir con ${formulario.body}.`
        : "Recibimos tu seña y tu lugar está guardado. Abajo está el saldo y los medios para completarlo cuando quieras.",
      cta: formulario?.cta,
    };
  }

  if (formulario) {
    return {
      title: "Cupo reservado",
      body: `Queda un paso importante: ${formulario.body}.`,
      cta: formulario.cta,
    };
  }

  return {
    title: "Estás dentro de este viaje",
    body: "Ya tenemos todo lo que necesitábamos por ahora. Vamos a escribirte con la preparación previa y los datos de logística.",
  };
}

export default async function SolicitarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/cuenta?next=/viajes/${id}/solicitar`);

  const { data: trip } = await supabase
    .from("trips")
    .select(
      "id, title, location, start_date, end_date, status, price, deposit_amount, payment_url, start_time, end_time, address, map_url, arrival_notes, packing_list"
    )
    .eq("id", id)
    .single();

  if (!trip) notFound();

  // La solicitud propia se lee por la vista: la tabla base no le devuelve
  // ninguna fila al postulante, ni siquiera las suyas.
  const { data: applications } = await supabase
    .from("my_applications")
    .select(
      "id, status, payment_status, amount_paid, is_first_time, health_form_submitted, consent_submitted, payment_proof_submitted, payment_proof_at"
    )
    .eq("trip_id", id)
    .order("created_at", { ascending: false });

  const existing = applications?.[0];
  const step = existing ? nextStep(id, existing) : null;

  // Los rieles de cobro sólo se leen cuando hacen falta: son datos bancarios y
  // no tienen por qué viajar a la pantalla de alguien que todavía está en
  // revisión.
  // También con la seña pagada: si el bloque desapareciera, la persona no
  // tendría desde dónde completar el saldo ni a quién mandarle el comprobante.
  const enPago =
    !!existing?.id &&
    existing.status === "approved" &&
    (existing.payment_status === "pending" ||
      existing.payment_status === "deposit_paid");
  const paymentMethods = enPago ? await getActivePaymentMethods() : [];

  // La logistica se muestra recien con el cupo pagado, y no antes: la direccion
  // exacta no es publica (por eso tampoco sale en /viajes/[id]) y "que llevar"
  // no le sirve a quien todavia no sabe si entra. Es el mismo contenido del
  // correo [7] de Sofia, para quien lo perdio o lo lee desde el sitio.
  const pagado =
    existing?.status === "approved" &&
    (existing.payment_status === "paid" ||
      existing.payment_status === "deposit_paid" ||
      existing.payment_status === "waived");
  const horario = formatTripHours(trip.start_time, trip.end_time);
  const logistica = pagado
    ? [
        trip.address && { label: "Dónde", value: trip.address, href: trip.map_url },
        horario && { label: "Horario", value: horario, href: null },
        trip.arrival_notes && {
          label: "Llegadas y salidas",
          value: trip.arrival_notes,
          href: null,
        },
        trip.packing_list && {
          label: "Qué llevar",
          value: trip.packing_list,
          href: null,
        },
      ].filter((x): x is { label: string; value: string; href: string | null } => !!x)
    : [];

  return (
    <>
      <Header />
      {/* El encabezado sigue el de la pantalla de acceso: volanta dorada,
          titulo blanco y bajada al 65%. Antes el titulo era dorado sobre el
          tramo negro del `body`. */}
      <main className={`pt-18 md:pt-24 ${funnelSurface}`}>
        <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
          <div className="mb-10">
            <span className="mb-3.5 block text-label-sm font-bold uppercase tracking-[0.21em] text-primary-container">
              Solicitud de participación
            </span>
            <h1 className="mb-2.5 font-display text-[clamp(1.875rem,3.4vw,2.375rem)] font-bold text-white">
              {trip.title}
            </h1>
            <p className="text-sm text-white/65">{trip.location}</p>
          </div>

          {step ? (
            <div className={`p-6 md:p-8 ${panel}`}>
              <h2 className={`mb-2 ${panelTitle}`}>{step.title}</h2>
              <p className={panelBody}>{step.body}</p>
              {step.cta && (
                <Link href={step.cta.href} className={`mt-6 ${pillButton}`}>
                  {step.cta.label}
                </Link>
              )}
            </div>
          ) : trip.status !== "open" ? (
            <div className={`p-6 md:p-8 ${panel}`}>
              <p className={panelBody}>
                Este viaje no está recibiendo solicitudes en este momento.
              </p>
            </div>
          ) : (
            <ScreeningForm tripId={id} defaultEmail={user.email} />
          )}

          {enPago && existing?.id && (
            <div className={`mt-6 p-6 md:p-8 ${panel}`}>
              <h2 className={`mb-4 ${panelTitle}`}>Cómo pagar</h2>

              {trip.price > 0 && (
                <div className={`mb-5 ${panelBody}`}>
                  {existing.payment_status === "deposit_paid" ? (
                    // Ya reservó: lo único que importa es cuánto falta. El
                    // plazo no se nombra — la pregunta 4 de
                    // docs/consulta-sofia-pagos.txt sigue sin respuesta.
                    <p>
                      Recibimos{" "}
                      <span className={`font-medium ${panelStrong}`}>
                        {formatAmount(existing.amount_paid ?? 0)}
                      </span>{" "}
                      de {formatAmount(trip.price)}. Queda un saldo de{" "}
                      <span className={`font-medium ${panelStrong}`}>
                        {formatAmount(trip.price - (existing.amount_paid ?? 0))}
                      </span>
                      , que podés completar de una vez o en partes.
                    </p>
                  ) : trip.deposit_amount ? (
                    // Las dos opciones, como las pide el correo [2] de Sofía.
                    <p>
                      Podés reservar tu cupo con una seña de{" "}
                      <span className={`font-medium ${panelStrong}`}>
                        {formatAmount(trip.deposit_amount)}
                      </span>{" "}
                      o pagar el total de{" "}
                      <span className={`font-medium ${panelStrong}`}>
                        {formatAmount(trip.price)}
                      </span>
                      . Si acordaste otro monto con nosotros, vale lo que
                      acordaron.
                    </p>
                  ) : (
                    <p>
                      Aporte de la experiencia:{" "}
                      <span className={`font-medium ${panelStrong}`}>
                        {formatAmount(trip.price)}
                      </span>
                      . Si acordaste una seña o un monto distinto con nosotros,
                      vale lo que acordaron.
                    </p>
                  )}
                </div>
              )}

              {/* El pago con tarjeta va PRIMERO y aparte de la lista: es el
                  unico riel que cobra solo, los demas son transferencia con
                  comprobante. El link es de Encuadrado y lo carga el admin en
                  el viaje; sin link, este bloque no existe y quedan las
                  transferencias de siempre.

                  `noopener noreferrer` no es ceremonia: la pestana nueva podria
                  tocar `window.opener` sin eso. */}
              {trip.payment_url && (
                <div className="mb-6 rounded-xl border border-primary-container/40 bg-primary-container/[0.08] p-5">
                  <p className="font-medium text-primary-container">
                    Pagar con tarjeta
                  </p>
                  <p className="mt-0.5 text-sm text-white/70">
                    Desde cualquier país, en dólares o pesos chilenos. Lo cobra
                    Encuadrado y puede tener un recargo por comisión.
                  </p>
                  <a
                    href={trip.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-4 ${pillButton}`}
                  >
                    Ir a pagar
                  </a>
                  {/* Encuadrado no nos avisa que el pago entro: no tiene
                      webhooks. Asi que el comprobante se pide igual, y quien
                      confirma sigue siendo Estela. */}
                  <p className="mt-3 text-sm text-white/70">
                    Cuando termines, subinos el comprobante acá abajo así lo
                    confirmamos.
                  </p>
                </div>
              )}

              {/* Sin rieles Y sin link no hay nada que mostrar, asi que se
                  avisa. Con link alcanza: el boton de arriba ya es el camino. */}
              {paymentMethods.length === 0 ? (
                trip.payment_url ? null : (
                  <p className={panelBody}>
                    Te vamos a escribir con los datos para hacer el pago. Cuando
                    lo hagas, podés enviarnos el comprobante desde acá.
                  </p>
                )
              ) : (
                <ul className="space-y-5">
                  {paymentMethods.map((method) => (
                    <li
                      key={method.id}
                      className="rounded-xl border border-white/[0.14] bg-white/[0.04] p-5"
                    >
                      <p className="font-medium text-primary-container">
                        {method.label}
                        {method.currency && (
                          <span className="font-normal text-white/60">
                            {" "}
                            · {method.currency}
                            {/* El aporte del viaje esta fijado en dolares (ver
                                formatAmount); cualquier otro riel cobra la
                                conversion del dia y hay que decirlo aca, o el
                                monto de arriba se lee como si fuera en esta
                                moneda. */}
                            {method.currency.toUpperCase() !== "USD" &&
                              " · el equivalente del día"}
                          </span>
                        )}
                      </p>
                      {method.audience && (
                        <p className="mt-0.5 text-sm text-white/60">
                          {method.audience}
                        </p>
                      )}
                      {/* `whitespace-pre-line`: las instrucciones se cargan como
                          una lista de datos y los saltos de línea son el formato. */}
                      <p className="mt-3 whitespace-pre-line text-sm text-white">
                        {method.instructions}
                      </p>
                      {method.link_url && (
                        <a
                          href={method.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`mt-4 ${pillButton}`}
                        >
                          Ir a pagar
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {existing.payment_proof_submitted && (
                <p className="mt-6 rounded-xl border border-primary-container/30 bg-primary-container/[0.08] px-5 py-4 text-sm text-white">
                  Recibimos tu comprobante
                  {existing.payment_proof_at
                    ? ` el ${new Date(existing.payment_proof_at).toLocaleDateString("es-CL", { day: "numeric", month: "long" })}`
                    : ""}
                  . Lo estamos verificando: en cuanto lo confirmemos te avisamos
                  por mail y se te habilita el paso siguiente.
                </p>
              )}

              <PaymentProofUpload
                tripId={id}
                applicationId={existing.id}
                yaSubio={!!existing.payment_proof_submitted}
              />
            </div>
          )}

          {logistica.length > 0 && (
            <div className={`mt-8 p-6 md:p-8 ${panel}`}>
              <h2 className={panelTitle}>Para tu llegada</h2>
              <dl className="mt-5 flex flex-col gap-5">
                {logistica.map((item) => (
                  <div key={item.label}>
                    <dt className="mb-1.5 text-xs uppercase tracking-widest text-white/55">
                      {item.label}
                    </dt>
                    <dd className="whitespace-pre-line text-sm leading-relaxed text-white">
                      {item.value}
                      {item.href && (
                        <>
                          {" "}
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-container underline underline-offset-4"
                          >
                            ver en el mapa
                          </a>
                        </>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
