import { Fragment } from "react";
import {
  chapterAnchor,
  splitItems,
  splitParagraphs,
  type MaterialBlock,
} from "@/lib/material";
import { materialBody } from "./fonts";

/**
 * El documento de "Envio material", con el formato del cuaderno de preparacion
 * de Egipto (28/10): tapa a sangre, indice, capitulos con el arranque en
 * negrita, cuerpo chico a dos columnas, frases destacadas en serif grande,
 * imagenes banner / perfil / cuadrada y contratapa.
 *
 * **Es presentacional y sin hooks**: lo usan la pagina publica (Server
 * Component) y la vista previa del panel (cliente). Todo el texto sale como
 * texto de React — nunca HTML —, asi que lo que cargue la clienta no puede
 * inyectar nada.
 *
 * En pantalla es una hoja continua; al imprimir ("Guardar como PDF") la hoja
 * se parte en A4 con numero de pagina y cada capitulo arranca pagina nueva.
 * El indice lleva links y no numeros de pagina: en la web no hay paginas.
 */
type Props = {
  title: string;
  eyebrow: string | null;
  coverUrl: string | null;
  backCoverUrl: string | null;
  blocks: MaterialBlock[];
};

/** `**negrita**` dentro de un parrafo. Todo lo demas, texto plano. */
function Inline({ text }: { text: string }) {
  const parts = text.split("**");
  const last = parts.length - 1;
  return (
    <>
      {parts.map((part, i) => {
        // Los indices impares quedaron entre dos `**`. Si hay un `**` sin
        // cierre, el ultimo tramo (impar y final) vuelve a ser texto normal.
        if (i % 2 === 1) {
          return i < last ? (
            <strong key={i}>{part}</strong>
          ) : (
            <Fragment key={i}>{`**${part}`}</Fragment>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

/**
 * Dos columnas solo para lo que fluye: texto, frases, listas e imagenes de
 * columna. Un capitulo, un banner o un texto a una columna cortan el flujo y
 * abren uno nuevo — es la composicion del PDF.
 */
function isBreaker(block: MaterialBlock) {
  return (
    block.type === "capitulo" ||
    (block.type === "imagen" && block.kind === "banner") ||
    (block.type === "texto" && block.columnas === 1)
  );
}

function BlockView({ block }: { block: MaterialBlock }) {
  switch (block.type) {
    case "capitulo":
      return (
        <header
          id={chapterAnchor(block.id)}
          className="material-chapter mt-14 mb-6 first:mt-0"
        >
          {block.parte && (
            <p className="material-serif mb-2 text-[0.95rem]">{block.parte}</p>
          )}
          <h2 className="material-serif text-[1.7rem] leading-[1.2] sm:text-[2.1rem]">
            {block.titulo && <strong>{block.titulo}</strong>}
            {block.titulo && block.resto && " "}
            {block.resto}
          </h2>
        </header>
      );

    case "texto":
      return (
        <div className={block.columnas === 1 ? "max-w-[34rem]" : undefined}>
          {splitParagraphs(block.texto).map((p, i) => (
            <p key={i} className="material-p">
              <Inline text={p} />
            </p>
          ))}
        </div>
      );

    case "destacado":
      return (
        <p className="material-serif material-quote">
          <Inline text={block.texto} />
        </p>
      );

    case "lista":
      return (
        <ul className="material-list">
          {splitItems(block.texto).map((item, i) => (
            <li key={i}>
              <Inline text={item} />
            </li>
          ))}
        </ul>
      );

    case "imagen":
      return (
        <figure
          className={`material-img ${
            block.kind === "banner" ? "my-8" : "my-5"
          }`}
        >
          {/* <img> y no next/image: la vista previa del panel tambien dibuja
              esto y la imagen ya llega comprimida y recortada del browser. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
            alt={block.alt}
            loading="lazy"
            className={`block w-full object-cover ${
              block.kind === "banner"
                ? "aspect-[16/9]"
                : block.kind === "perfil"
                  ? "aspect-[3/4]"
                  : "aspect-square"
            }`}
          />
        </figure>
      );
  }
}

/** Parte los bloques en tramos: flujo de columnas o bloque suelto. */
function toRuns(blocks: MaterialBlock[]) {
  const runs: { flow: boolean; blocks: MaterialBlock[] }[] = [];
  for (const block of blocks) {
    if (isBreaker(block)) {
      runs.push({ flow: false, blocks: [block] });
      continue;
    }
    const last = runs[runs.length - 1];
    if (last?.flow) last.blocks.push(block);
    else runs.push({ flow: true, blocks: [block] });
  }
  return runs;
}

export function MaterialDocument({
  title,
  eyebrow,
  coverUrl,
  backCoverUrl,
  blocks,
}: Props) {
  const chapters = blocks.filter(
    (b): b is Extract<MaterialBlock, { type: "capitulo" }> =>
      b.type === "capitulo"
  );

  return (
    <article className={`material-root ${materialBody.variable}`}>
      <style>{CSS}</style>

      {coverUrl && (
        <section className="material-cover relative mx-auto aspect-[210/297] w-full max-w-[820px] overflow-hidden bg-[#050b3a]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt=""
            className="material-cover-img absolute inset-0 h-full w-full object-cover"
          />
          {/* El contenedor de `cqw` es este div SIN padding: asi las medidas
              del titulo escalan con el ancho de la hoja entera. */}
          <div className="material-cover-text absolute inset-x-0 top-[27%] [container-type:inline-size]">
            <div className="px-[8%] text-center">
              {eyebrow && (
                <p className="material-serif mb-[3cqw] text-[2.3cqw] tracking-[0.04em] text-[#d9b96b]">
                  ✷ {eyebrow} ✷
                </p>
              )}
              <h1 className="material-serif text-[7.4cqw] leading-[1.12] text-[#c9a24f]">
                {title}
              </h1>
            </div>
          </div>
        </section>
      )}

      <div className="material-sheet mx-auto w-full max-w-[820px] bg-white px-6 py-10 text-[#05125a] sm:px-12 sm:py-14 md:px-16">
        {!coverUrl && (
          <header className="mb-12">
            {eyebrow && (
              <p className="material-serif mb-3 text-[1rem]">{eyebrow}</p>
            )}
            <h1 className="material-serif text-[2.4rem] leading-[1.1]">
              {title}
            </h1>
          </header>
        )}

        {chapters.length > 1 && (
          <nav aria-label="Índice" className="material-index mb-14">
            <h2 className="material-serif mb-6 text-[2rem]">Índice</h2>
            <ol className="flex flex-col gap-2.5 text-[0.95rem]">
              {chapters.map((chapter) => (
                <li key={chapter.id}>
                  <a
                    href={`#${chapterAnchor(chapter.id)}`}
                    className="underline decoration-[#05125a]/30 underline-offset-4 hover:decoration-[#05125a]"
                  >
                    {chapter.titulo} {chapter.resto}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {toRuns(blocks).map((run, i) =>
          run.flow ? (
            <div key={i} className="material-cols">
              {run.blocks.map((block) => (
                <BlockView key={block.id} block={block} />
              ))}
            </div>
          ) : (
            <BlockView key={i} block={run.blocks[0]} />
          )
        )}
      </div>

      {backCoverUrl && (
        <section className="material-cover material-back relative mx-auto aspect-[210/297] w-full max-w-[820px] overflow-hidden bg-[#050b3a]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backCoverUrl}
            alt=""
            className="material-cover-img absolute inset-0 h-full w-full object-cover"
          />
        </section>
      )}
    </article>
  );
}

/**
 * Estilos que Tailwind no expresa bien: columnas con cortes controlados, la
 * cascada de Georgia y todo lo de impresion. Es un string fijo — no lleva
 * nada que cargue la clienta.
 */
const CSS = `
.material-root { font-family: var(--font-material), "Quattrocento Sans", Calibri, sans-serif; }
.material-serif { font-family: Georgia, "Times New Roman", "Liberation Serif", serif; font-synthesis-weight: auto; }
.material-p { font-size: 0.92rem; line-height: 1.55; margin: 0 0 1rem; }
.material-p strong, .material-list strong { font-weight: 700; }
.material-quote { font-size: 1.28rem; line-height: 1.32; margin: 0.4rem 0 1.4rem; break-inside: avoid; }
.material-list { font-size: 0.92rem; line-height: 1.55; margin: 0 0 1rem; padding-left: 1.1rem; list-style: disc; }
.material-list li { margin-bottom: 0.3rem; }
.material-img { break-inside: avoid; margin-inline: 0; }
.material-cols > :first-child { margin-top: 0; }
@media (min-width: 640px) {
  .material-cols { column-count: 2; column-gap: 2.6rem; }
}
/* Mismos margenes en TODAS las paginas: con margenes distintos entre paginas
   (por ejemplo una tapa con margen 0) Chromium maqueta a un ancho y recorta al
   otro. Tampoco se puede sacar la tapa "a sangre" desbordando el area de
   contenido: Chromium recorta todo lo que sale de ella. Por eso en el PDF la
   tapa ocupa el area de contenido, con el margen blanco de la hoja. */
@page { size: A4; margin: 16mm 15mm 18mm; @bottom-right { content: counter(page); font-size: 9pt; color: #05125a; } }
@page cover { @bottom-right { content: none; } }
@media print {
  html, body { background: #fff !important; }
  body::before { display: none !important; }
  .material-cover { page: cover; break-after: page; width: 100%; max-width: none; height: 263mm; aspect-ratio: auto; }
  .material-back { break-before: page; break-after: auto; }
  .material-sheet { max-width: none !important; padding: 0 !important; box-shadow: none !important; }
  .material-cols { column-count: 2; column-gap: 9mm; }
  .material-p, .material-list { font-size: 9.5pt; }
  .material-quote { font-size: 12.5pt; }
  .material-chapter { break-before: page; break-after: avoid; margin-top: 0 !important; }
  .material-index { break-after: page; }
  .material-noprint { display: none !important; }
}
`;
