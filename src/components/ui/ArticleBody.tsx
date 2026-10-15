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
    body: "text-[#05125a]",
  },
} as const;

export function ArticleBody({
  blocks,
  tone = "dark",
  floating = false,
}: {
  blocks: ArticleBlock[];
  tone?: keyof typeof TONO;
  /**
   * Lectura "flotante" (15/10, pedido de la organización): sin recuadro, el
   * texto directo sobre la crema. Filete con estrella al arranque y estrella al
   * cierre, apertura en serif con capitular dorada y citas centradas. Sólo para
   * `tone="light"`; las legales siguen con la plantilla de siempre.
   */
  floating?: boolean;
}) {
  const c = TONO[tone];
  const body = (
    <div
      className={
        floating
          ? "flex flex-col gap-5 text-pretty sm:gap-6 " +
            // Apertura en la serif del sitio con capitular dorada (el dorado
            // oscuro es relleno/ornamento, no texto chico: la capitular mide
            // 4em). `[&>p:first-child]` sólo toca un párrafo de apertura; si el
            // artículo abre con un título no hay capitular.
            "[&>p:first-child]:font-display [&>p:first-child]:text-[20px] [&>p:first-child]:leading-[1.55] sm:[&>p:first-child]:text-[24px] " +
            "[&>p:first-child::first-letter]:float-left [&>p:first-child::first-letter]:pr-2 [&>p:first-child::first-letter]:pt-1 [&>p:first-child::first-letter]:font-display [&>p:first-child::first-letter]:text-[2.9em] [&>p:first-child::first-letter]:leading-[0.8] [&>p:first-child::first-letter]:text-[#b3964b] sm:[&>p:first-child::first-letter]:pr-2.5 sm:[&>p:first-child::first-letter]:pt-1.5 sm:[&>p:first-child::first-letter]:text-[4.2em]"
          : "flex flex-col gap-5"
      }
    >
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
                className={
                  floating
                    ? `my-3 px-2 text-center font-display text-[21px] leading-[1.5] sm:px-6 sm:text-[24px] ${c.heading} before:mb-3 before:block before:text-sm before:text-[#b3964b] before:content-['✦']`
                    : `my-2 border-l-2 py-1 pl-5 font-display text-body-lg ${c.quote}`
                }
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
                    className={`relative pl-6 leading-relaxed ${floating ? "text-[17px] sm:text-[18px]" : "text-body-md"} ${c.body}`}
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
                className={
                  floating
                    ? `text-[17px] leading-[1.8] sm:text-[18px] sm:leading-[30px] ${c.body}`
                    : `text-body-md leading-relaxed ${c.body}`
                }
              >
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );

  if (!floating) return body;

  const filete = "h-px flex-1 bg-gradient-to-r from-transparent to-[#b3964b]";
  return (
    <div>
      <div
        aria-hidden="true"
        className="mb-10 flex items-center gap-4 text-[#b3964b] sm:mb-12"
      >
        <span className={filete} />
        <span className="text-sm">✦</span>
        <span className={filete + " rotate-180"} />
      </div>
      {body}
      <div
        aria-hidden="true"
        className="mt-12 flex justify-center text-[#b3964b] sm:mt-14"
      >
        ✦
      </div>
    </div>
  );
}
