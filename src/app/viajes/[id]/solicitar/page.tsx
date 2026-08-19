import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { createClient } from "@/lib/supabase/server";
import { ScreeningForm } from "./ScreeningForm";

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
  }
): Step {
  if (app.status === "rejected") {
    return {
      title: "Tu solicitud no fue aprobada para este viaje",
      body: "Podés postularte a otro viaje más adelante.",
    };
  }

  if (app.status === "expired") {
    return {
      title: "Tu aprobación para este viaje fue invalidada",
      body: "Contactanos si creés que esto es un error.",
    };
  }

  if (app.status !== "approved") {
    return {
      title: "Tu solicitud está en revisión",
      body: "Estela la está leyendo. Te vamos a avisar apenas tengamos una respuesta, y ahí seguimos con la reserva del cupo.",
    };
  }

  // Aprobada. El pago todavía no se hace en la web: lo coordina Estela y lo
  // marca a mano desde el panel (no hay pasarela elegida).
  if (app.payment_status === "pending") {
    return {
      title: "Tu solicitud fue aprobada",
      body: "Para reservar tu cupo falta la seña. Te vamos a escribir con los datos del pago; en cuanto quede registrado seguimos con el formulario de salud.",
    };
  }

  if (app.is_first_time && !app.health_form_submitted) {
    return {
      title: "Cupo reservado",
      body: "Queda un paso importante: el formulario de salud completo, que es lo que nos permite preparar la ceremonia y cuidar tu proceso.",
      cta: { href: `/viajes/${tripId}/salud`, label: "Completar el formulario de salud" },
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
    .select("id, title, location, start_date, end_date, status")
    .eq("id", id)
    .single();

  if (!trip) notFound();

  // La solicitud propia se lee por la vista: la tabla base no le devuelve
  // ninguna fila al postulante, ni siquiera las suyas.
  const { data: applications } = await supabase
    .from("my_applications")
    .select("id, status, payment_status, is_first_time, health_form_submitted")
    .eq("trip_id", id)
    .order("created_at", { ascending: false });

  const existing = applications?.[0];
  const step = existing ? nextStep(id, existing) : null;

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen">
        <div className="px-5 max-w-3xl mx-auto py-16 md:py-20">
          <div className="mb-10">
            <span className="text-xs font-medium tracking-[0.05em] uppercase text-secondary block mb-2">
              Solicitud de participación
            </span>
            <h1 className="font-display text-[32px] md:text-[40px] font-medium text-primary-fixed-dim mb-2">
              {trip.title}
            </h1>
            <p className="text-on-surface-variant">{trip.location}</p>
          </div>

          {step ? (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-display text-xl text-primary-fixed-dim mb-2">
                {step.title}
              </h2>
              <p className="text-on-surface-variant">{step.body}</p>
              {step.cta && (
                <Link
                  href={step.cta.href}
                  className="inline-block mt-5 bg-primary-container text-on-primary font-medium tracking-[0.05em] rounded-lg px-5 py-2.5 hover:bg-primary-fixed transition-colors"
                >
                  {step.cta.label}
                </Link>
              )}
            </div>
          ) : trip.status !== "open" ? (
            <div className="glass-card rounded-2xl p-6">
              <p className="text-on-surface-variant">
                Este viaje no está recibiendo solicitudes en este momento.
              </p>
            </div>
          ) : (
            <ScreeningForm tripId={id} defaultEmail={user.email} />
          )}
        </div>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
