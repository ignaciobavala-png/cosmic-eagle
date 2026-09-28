import type { Faq } from "@/lib/faqs";

/**
 * Colores de la lista segun el fondo donde cae. `light` es la franja crema de
 * /faqs; `dark` es el azul de la home (28/09), donde el azul del texto y el oro
 * oscuro de la cruz no se verian: ahi va el blanco calido para la pregunta, el
 * mismo beige del cuerpo de "Nuestro proposito" para la respuesta y el oro
 * claro (`primary-container`, el de texto sobre azul) para la cruz.
 */
const TONES = {
  light: {
    list: "divide-[#05125a]/15 border-[#05125a]/15",
    question: "text-[#05125a]",
    answer: "text-[#05125a]",
    cross: "bg-[#755c21]",
  },
  dark: {
    list: "divide-primary-container/20 border-primary-container/20",
    question: "text-primary",
    answer: "text-[#d0c5b4]",
    cross: "bg-primary-container",
  },
} as const;

/**
 * Lista de preguntas plegables.
 *
 * Va con `<details>` nativo y **sin estado de React**, como el acordeon de
 * /admin/multimedia: no necesita JS, funciona con el teclado, y el buscador del
 * navegador (Ctrl+F) encuentra el texto de una respuesta cerrada y la abre solo.
 * Un acordeon propio pierde las tres cosas.
 *
 * Las respuestas se parten en parrafos con la misma regla del cuerpo de los
 * articulos —linea en blanco = parrafo— y salen como TEXTO dentro de <p>: no
 * hay sanitizador en el proyecto, asi que aceptar HTML del formulario seria un
 * XSS almacenado.
 */
export function FaqList({
  faqs,
  tone = "light",
}: {
  faqs: Faq[];
  tone?: keyof typeof TONES;
}) {
  const t = TONES[tone];

  return (
    <ul className={`divide-y border-y ${t.list}`}>
      {faqs.map((faq) => (
        <li key={faq.id}>
          <details className="group">
            <summary
              className={`flex cursor-pointer list-none items-start justify-between gap-4 py-5 text-body-md font-medium marker:content-none ${t.question}`}
            >
              {faq.question}
              {/* Cruz que rota a "x" al abrir: dos barras, sin icono ni JS. */}
              <span
                aria-hidden="true"
                className="relative mt-2 h-3 w-3 shrink-0 transition-transform duration-300 group-open:rotate-45"
              >
                <span className={`absolute top-1/2 left-0 h-px w-full -translate-y-1/2 ${t.cross}`} />
                <span className={`absolute top-0 left-1/2 h-full w-px -translate-x-1/2 ${t.cross}`} />
              </span>
            </summary>
            <div className={`space-y-4 pb-6 text-body-md leading-relaxed ${t.answer}`}>
              {faq.answer
                .replace(/\r\n/g, "\n")
                .split(/\n{2,}/)
                .map((p) => p.trim())
                .filter(Boolean)
                .map((paragraph, i) => (
                  // Dentro de un parrafo los saltos simples se colapsan: un
                  // Enter suelto en el textarea no deberia partir la frase.
                  <p key={i}>{paragraph.replace(/\s*\n\s*/g, " ")}</p>
                ))}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
