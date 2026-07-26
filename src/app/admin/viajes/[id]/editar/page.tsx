import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TripForm } from "../../TripForm";
import { updateTrip } from "../../actions";

export default async function EditarViajePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (!trip) notFound();

  return (
    <div>
      <h1 className="font-display text-3xl text-primary mb-8">Editar viaje</h1>
      <TripForm trip={trip} action={updateTrip.bind(null, id)} />
    </div>
  );
}
