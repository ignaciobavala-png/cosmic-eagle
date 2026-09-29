import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TRIP_TYPES, isTripType } from "@/lib/trip-type";
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

  const meta = isTripType(trip.type) ? TRIP_TYPES[trip.type] : TRIP_TYPES.retiro;

  return (
    <div>
      <Link
        href={meta.adminPath}
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        {meta.plural}
      </Link>
      <h1 className="font-display text-3xl text-primary-fixed-dim mb-8">
        {meta.editTitle}
      </h1>
      <TripForm
        trip={trip}
        type={meta.value}
        action={updateTrip.bind(null, id)}
      />
    </div>
  );
}
