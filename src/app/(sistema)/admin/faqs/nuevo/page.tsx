import { FaqForm } from "../FaqForm";
import { createFaq } from "../actions";

export default function NuevaFaqPage() {
  return (
    <div>
      <h1 className="mb-8 font-display text-2xl text-primary-fixed-dim sm:text-3xl">
        Nueva pregunta
      </h1>
      <FaqForm action={createFaq} submitLabel="Guardar" />
    </div>
  );
}
