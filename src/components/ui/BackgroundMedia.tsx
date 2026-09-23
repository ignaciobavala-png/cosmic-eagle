"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { isVideoUrl } from "@/lib/media";

/**
 * Fondo a pantalla completa de una seccion: imagen o video, segun lo que haya
 * cargado la clienta en el slot (`isVideoUrl` decide por la extension).
 *
 * El video va `muted` + `playsInline` porque sin las dos cosas el autoplay no
 * arranca en mobile —ni en Safari ni en Chrome—, y `loop` porque son clips de
 * pocos segundos pensados como fondo.
 *
 * `preload="metadata"` y no `auto`: el navegador baja el encabezado y el primer
 * frame, y el resto mientras reproduce. Con `auto` el video compite con el resto
 * de la pagina por el ancho de banda justo en la primera pantalla.
 *
 * **No lleva controles ni audio a proposito**: es decoracion. Por eso tambien va
 * `aria-hidden` — un lector de pantalla no tiene nada que anunciar de un fondo, y
 * el texto encima ya cuenta la historia.
 */
export function BackgroundMedia({
  src,
  alt = "",
  priority = false,
  className = "object-cover",
  // Pedido de la organización, 23/09: el video del hero se sentía "rápido"
  // y pidieron una secuencia lenta y contemplativa. El archivo no se
  // recorta ni se re-exporta: se reproduce a velocidad reducida.
  rate = 1,
}: {
  src: string;
  alt?: string;
  priority?: boolean;
  className?: string;
  rate?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // `playbackRate` no existe como atributo de video en HTML/JSX: hay que
  // fijarlo de forma imperativa sobre el elemento montado.
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = rate;
  }, [rate]);

  if (isVideoUrl(src)) {
    return (
      <video
        ref={videoRef}
        src={src}
        aria-hidden="true"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className={`absolute inset-0 h-full w-full ${className}`}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="100vw"
      className={className}
    />
  );
}
