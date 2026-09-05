import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { createClient } from "@/lib/supabase/server";
import { funnelSurface } from "@/components/forms/styles";
import { HealthForm } from "./HealthForm";

/**
 * Etapa 2 del flujo: el formulario de salud extenso.
 *
 * Sólo se llega acá con la solicitud aprobada y el pago registrado. Cualquier
 * otro estado vuelve a /viajes/[id]/solicitar, que es la pantalla que sabe
 * explicar en qué paso está la persona.
 */
export default async function SaludPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/cuenta?next=/viajes/${id}/salud`);

  const { data: trip } = await supabase
    .from("trips")
    .select("id, title, location")
    .eq("id", id)
    .single();

  if (!trip) notFound();

  const { data: applications } = await supabase
    .from("my_applications")
    .select("id, status, payment_status, is_first_time, health_form_submitted")
    .eq("trip_id", id)
    .order("created_at", { ascending: false });

  const app = applications?.[0];
  const puedeCompletar =
    app?.id &&
    app.status === "approved" &&
    app.payment_status !== "pending" &&
    app.is_first_time &&
    !app.health_form_submitted;

  if (!puedeCompletar) redirect(`/viajes/${id}/solicitar`);

  return (
    <>
      <Header />
      <main className={`pt-18 md:pt-24 ${funnelSurface}`}>
        <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
          <div className="mb-10">
            <span className="mb-3.5 block text-label-sm font-bold uppercase tracking-[0.21em] text-primary-container">
              Formulario de salud
            </span>
            <h1 className="mb-2.5 font-display text-[clamp(1.875rem,3.4vw,2.375rem)] font-bold text-white">
              {trip.title}
            </h1>
            <p className="text-sm text-white/65">{trip.location}</p>
          </div>

          <HealthForm tripId={id} applicationId={app.id!} />
        </div>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
