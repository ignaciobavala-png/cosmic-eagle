import type { ArticleBlock } from "@/lib/article";

/**
 * Render de un cuerpo de articulo ya parseado. Vive aparte de la pagina porque
 * la plantilla de lectura es un pedido explicito de la clienta —una sola grafica
 * para todos los contenidos, ver docs/BIBLIOTECA.md §1.3— y porque el Manual
 * Evolutivo va a reusarla tal cual.
 *
 * Cada rama elige una etiqueta y **nada mas**: el texto sale como texto. No hay
 * `dangerouslySetInnerHTML` en ningun lado y no lo tiene que haber (ver el
 * comentario de `parseArticleBody`).
 */
export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={index}
                className="mt-6 font-display text-headline-md text-primary-fixed-dim"
              >
                {block.text}
              </h2>
            );

          case "subheading":
            return (
              <h3
                key={index}
                className="mt-3 font-display text-body-lg text-primary-container"
              >
                {block.text}
              </h3>
            );

          case "quote":
            return (
              <blockquote
                key={index}
                className="my-2 border-l-2 border-primary-fixed-dim/60 py-1 pl-5 font-display text-body-lg text-primary-fixed-dim"
              >
                {block.text}
              </blockquote>
            );

          case "list":
            return (
              <ul key={index} className="flex flex-col gap-3">
                {block.items.map((item, i) => (
                  <li
                    key={i}
                    className="relative pl-6 text-body-md leading-relaxed text-on-surface"
                  >
                    {/* La estrella de cuatro puntas del sistema de Julia, en
                        texto: es decorativa y no la tiene que leer un lector de
                        pantalla, que ya anuncia la lista. */}
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-[0.15em] text-primary-fixed-dim/70"
                    >
                      ✦
                    </span>
                    {item.lead && (
                      <strong className="font-semibold text-primary-container">
                        {item.lead}{" "}
                      </strong>
                    )}
                    {item.text}
                  </li>
                ))}
              </ul>
            );

          default:
            return (
              <p
                key={index}
                className="text-body-md leading-relaxed text-on-surface"
              >
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}
