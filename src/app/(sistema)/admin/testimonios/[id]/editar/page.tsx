import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TestimonialForm } from "../../TestimonialForm";
import { updateTestimonial } from "../../actions";

export default async function EditarTestimonioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: testimonial } = await supabase
    .from("testimonials")
    .select("id, placement, quote, author_name, author_location, sort_order, is_published")
    .eq("id", id)
    .maybeSingle();

  if (!testimonial) notFound();

  return (
    <div>
      <h1 className="mb-8 font-display text-2xl text-primary-fixed-dim sm:text-3xl">
        Editar testimonio
      </h1>
      <TestimonialForm
        // El id viaja atado al action, no por un campo del form: asi no se puede
        // editar otro testimonio manipulando un hidden.
        action={updateTestimonial.bind(null, testimonial.id)}
        values={testimonial}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
