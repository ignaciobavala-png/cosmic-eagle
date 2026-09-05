import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { createClient } from "@/lib/supabase/server";
import { funnelSurface, panel, panelBody, panelTitle } from "@/components/forms/styles";
import {
  CONSENT_DECLARATION,
  CONSENT_INTRO,
  CONSENT_SECTIONS,
} from "@/lib/consent";
import { ConsentForm } from "./ConsentForm";

/**
 * El consentimiento informado, el paso que faltaba del embudo.
 *
 * Va DESPUÉS del formulario de salud, no antes: una de las cuatro
 * confirmaciones dice "he rellenado el formulario de salud obligatorio", así
 * que a un primerizo que todavía no lo mandó se lo manda ahí primero. Es el
 * orden del proceso de Sofía (docs/FLUJO_INSCRIPCION.md).
 *
 * El texto es de la clienta y vive en `src/lib/consent.ts`, transcripto literal
 * de su formulario de Google. Acá sólo se dibuja.
 */
export default async function ConsentimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/cuenta?next=/viajes/${id}/consentimiento`);

  const { data: trip } = await supabase
    .from("trips")
    .select("id, title, location")
    .eq("id", id)
    .single();

  if (!trip) notFound();

  const { data: applications } = await supabase
    .from("my_applications")
    .select(
      "id, status, payment_status, is_first_time, health_form_submitted, consent_submitted"
    )
    .eq("trip_id", id)
    .order("created_at", { ascending: false });

  const app = applications?.[0];

  // Mismo portón que el formulario de salud: aprobada y con el cupo reservado.
  const reservado =
    app?.id && app.status === "approved" && app.payment_status !== "pending";

  if (!reservado || app.consent_submitted) redirect(`/viajes/${id}/solicitar`);
  if (app.is_first_time && !app.health_form_submitted) {
    redirect(`/viajes/${id}/salud`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <>
      <Header />
      <main className={`pt-18 md:pt-24 ${funnelSurface}`}>
        <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
          <div className="mb-10">
            <span className="mb-3.5 block text-label-sm font-bold uppercase tracking-[0.21em] text-primary-container">
              Consentimiento informado
            </span>
            <h1 className="mb-2.5 font-display text-[clamp(1.875rem,3.4vw,2.375rem)] font-bold text-white">
              {trip.title}
            </h1>
            <p className="text-sm text-white/65">{trip.location}</p>
          </div>

          <div className={`p-6 md:p-8 ${panel}`}>
            <p className={`text-sm ${panelBody}`}>{CONSENT_INTRO}</p>

            <div className="mt-8 flex flex-col gap-7">
              {CONSENT_SECTIONS.map((section) => (
                <section key={section.title}>
                  <h2 className={panelTitle}>{section.title}</h2>
                  {"body" in section ? (
                    <p className={`mt-2 text-sm leading-relaxed ${panelBody}`}>
                      {section.body}
                    </p>
                  ) : (
                    <ul
                      className={`mt-2 flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed ${panelBody}`}
                    >
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            {/* La declaración se separa del resto: es lo que se está firmando,
                no un bloque informativo más. */}
            <section className="mt-8 rounded-xl border border-primary-container/30 bg-primary-container/[0.08] p-5">
              <h2 className={panelTitle}>{CONSENT_DECLARATION.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white">
                {CONSENT_DECLARATION.body}
              </p>
            </section>

            <ConsentForm
              tripId={id}
              applicationId={app.id!}
              defaultName={profile?.full_name?.trim() || undefined}
            />
          </div>
        </div>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
