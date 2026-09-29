import { TestimonialForm } from "../TestimonialForm";
import { createTestimonial } from "../actions";

export default function NuevoTestimonioPage() {
  return (
    <div>
      <h1 className="mb-8 font-display text-2xl text-primary-fixed-dim sm:text-3xl">
        Nuevo testimonio
      </h1>
      <TestimonialForm action={createTestimonial} submitLabel="Guardar" />
    </div>
  );
}
