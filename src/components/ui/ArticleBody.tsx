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
 *
 * **`tone`** existe porque la misma plantilla se lee sobre dos fondos: el
 * articulo vive sobre crema desde el 05/09/2026 y las paginas legales siguen
 * sobre el fondo oscuro del `body`. No son dos componentes: es el mismo texto
 * con la misma jerarquia, y partirlo garantizaria que uno de los dos se quede
 * atras en el proximo cambio.
 */
const TONO = {
  dark: {
    heading: "text-primary-fixed-dim",
    sub: "text-primary-container",
    quote: "border-primary-fixed-dim/60 text-primary-fixed-dim",
    bullet: "text-primary-fixed-dim/70",
    lead: "text-primary-container",
    body: "text-on-surface",
  },
  light: {
    heading: "text-[#05125a]",
    sub: "text-on-primary-container",
    // Sobre crema el oro de acento no se lee: el filete de la cita va dorado
    // (es un borde, no texto) y la letra va azul.
    quote: "border-[#f9d78f] text-[#05125a]",
    bullet: "text-on-primary-container",
    lead: "text-[#05125a]",
    body: "text-[#333]",
  },
} as const;

export function ArticleBody({
  blocks,
  tone = "dark",
}: {
  blocks: ArticleBlock[];
  tone?: keyof typeof TONO;
}) {
  const c = TONO[tone];
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={index}
                className={`mt-6 font-display text-headline-md font-bold ${c.heading}`}
              >
                {block.text}
              </h2>
            );

          case "subheading":
            return (
              <h3
                key={index}
                className={`mt-3 font-display text-body-lg ${c.sub}`}
              >
                {block.text}
              </h3>
            );

          case "quote":
            return (
              <blockquote
                key={index}
                className={`my-2 border-l-2 py-1 pl-5 font-display text-body-lg ${c.quote}`}
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
                    className={`relative pl-6 text-body-md leading-relaxed ${c.body}`}
                  >
                    {/* La estrella de cuatro puntas del sistema de Julia, en
                        texto: es decorativa y no la tiene que leer un lector de
                        pantalla, que ya anuncia la lista. */}
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 top-[0.15em] ${c.bullet}`}
                    >
                      ✦
                    </span>
                    {item.lead && (
                      <strong className={`font-semibold ${c.lead}`}>
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
                className={`text-body-md leading-relaxed ${c.body}`}
              >
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}
