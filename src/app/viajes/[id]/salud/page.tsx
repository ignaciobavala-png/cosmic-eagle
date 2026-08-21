import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { createClient } from "@/lib/supabase/server";
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
      <main className="pt-16 lg:pt-21 min-h-screen">
        <div className="px-5 max-w-3xl mx-auto py-16 md:py-20">
          <div className="mb-10">
            <span className="text-xs font-medium tracking-[0.05em] uppercase text-secondary block mb-2">
              Formulario de salud
            </span>
            <h1 className="font-display text-[32px] md:text-[40px] font-medium text-primary-fixed-dim mb-2">
              {trip.title}
            </h1>
            <p className="text-on-surface-variant">{trip.location}</p>
          </div>

          <HealthForm tripId={id} applicationId={app.id!} />
        </div>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
