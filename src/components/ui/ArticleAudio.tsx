import { Headphones } from "lucide-react";

/**
 * El audio de un contenido, arriba del texto (08/10: el guion del video de
 * bienvenida llegó con su locución). Es el `<audio>` nativo a propósito: trae
 * play, barra, tiempo y velocidad en todos los browsers, con teclado y lector de
 * pantalla resueltos, y en el teléfono sigue sonando con la pantalla apagada.
 * Un reproductor propio sería mucho código para perder justamente eso.
 *
 * `preload="metadata"` baja sólo la duración, no los 4MB del archivo.
 */
export function ArticleAudio({
  src,
  label,
  className = "",
}: {
  src: string;
  label: string;
  /** Sólo los márgenes del lugar donde va. */
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-[#f9d78f] bg-[#fff6eb] p-4 sm:p-5 ${className}`}>
      <p className="mb-3 flex items-center gap-2 text-label-sm uppercase text-on-primary-container">
        <Headphones size={15} aria-hidden="true" />
        {label}
      </p>
      <audio controls preload="metadata" src={src} className="w-full">
        <a href={src}>{label}</a>
      </audio>
    </div>
  );
}
