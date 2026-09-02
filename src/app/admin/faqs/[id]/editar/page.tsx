import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FaqForm } from "../../FaqForm";
import { updateFaq } from "../../actions";

export default async function EditarFaqPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: faq } = await supabase
    .from("faqs")
    .select("id, placement, question, answer, sort_order, is_published")
    .eq("id", id)
    .maybeSingle();

  if (!faq) notFound();

  return (
    <div>
      <h1 className="mb-8 font-display text-2xl text-primary-fixed-dim sm:text-3xl">
        Editar pregunta
      </h1>
      <FaqForm
        // El id viaja atado al action, no por un campo del form: asi no se puede
        // editar otra pregunta manipulando un hidden.
        action={updateFaq.bind(null, faq.id)}
        values={faq}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
