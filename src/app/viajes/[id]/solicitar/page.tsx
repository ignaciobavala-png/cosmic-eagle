import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { createClient } from "@/lib/supabase/server";
import { FirstTimeForm } from "./FirstTimeForm";
import { ReturningForm } from "./ReturningForm";

const STATUS_MESSAGE: Record<string, { title: string; body: string }> = {
  pending_review: {
    title: "Tu solicitud está en revisión",
    body: "Nuestro equipo la está evaluando. Te vamos a avisar apenas tengamos una respuesta.",
  },
  approved: {
    title: "Tu solicitud fue aprobada",
    body: "Ya sos parte de este viaje. Pronto vas a recibir el consentimiento informado para completar antes de la ceremonia.",
  },
  rejected: {
    title: "Tu solicitud no fue aprobada para este viaje",
    body: "Podés postularte a otro viaje más adelante.",
  },
  expired: {
    title: "Tu aprobación para este viaje fue invalidada",
    body: "Contactanos si creés que esto es un error.",
  },
};

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

  const [
    { data: myFirstTime },
    { data: myReturning },
    { count: approvedFirstTime },
    { count: approvedReturning },
  ] = await Promise.all([
    supabase
      .from("my_applications_first_time")
      .select("id, status")
      .eq("trip_id", id),
    supabase
      .from("my_applications_returning")
      .select("id, status")
      .eq("trip_id", id),
    supabase
      .from("applications_first_time")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "approved"),
    supabase
      .from("applications_returning")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "approved"),
  ]);

  const existing = [...(myFirstTime ?? []), ...(myReturning ?? [])][0];
  const isReturning = (approvedFirstTime ?? 0) + (approvedReturning ?? 0) > 0;

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen">
        <div className="px-5 max-w-3xl mx-auto py-16 md:py-20">
          <div className="mb-10">
            <span className="text-xs font-medium tracking-[0.05em] uppercase text-secondary block mb-2">
              Solicitud de participación
            </span>
            <h1 className="font-display text-[32px] md:text-[40px] font-medium text-primary mb-2">
              {trip.title}
            </h1>
            <p className="text-on-surface-variant">{trip.location}</p>
          </div>

          {trip.status !== "open" ? (
            <div className="glass-card rounded-2xl p-6">
              <p className="text-on-surface-variant">
                Este viaje no está recibiendo solicitudes en este momento.
              </p>
            </div>
          ) : existing ? (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-display text-xl text-primary mb-2">
                {STATUS_MESSAGE[existing.status ?? "pending_review"].title}
              </h2>
              <p className="text-on-surface-variant">
                {STATUS_MESSAGE[existing.status ?? "pending_review"].body}
              </p>
            </div>
          ) : isReturning ? (
            <ReturningForm tripId={id} defaultEmail={user.email} />
          ) : (
            <FirstTimeForm tripId={id} defaultEmail={user.email} />
          )}
        </div>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
