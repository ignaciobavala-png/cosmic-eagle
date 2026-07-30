import { TripForm } from "../TripForm";
import { createTrip } from "../actions";

export default function NuevoViajePage() {
  return (
    <div>
      <h1 className="font-display text-3xl text-primary-fixed-dim mb-8">Nuevo viaje</h1>
      <TripForm action={createTrip} />
    </div>
  );
}
