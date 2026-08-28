"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Facade de YouTube: tapa propia con el ▶ dibujado y el iframe montado recién
 * en el click (ver docs: un `<iframe src="youtube.com/embed/…">` directo son
 * ~1.3 MB de JS y cookies desde el primer paint). Quien no le da play no manda
 * un byte a Google.
 *
 * La tapa es una imagen propia del sitio — nunca `i.ytimg.com`: es otro request
 * a un tercero y viene en color, que rompe el diseño.
 *
 * `autoplay=1` en el src funciona porque el iframe se monta dentro del render
 * que dispara el click (los eventos discretos de React se flushan sincrónicos):
 * el navegador lo cuenta como gesto del usuario.
 */
export function YouTubeFacade({
  videoId,
  title,
  cover,
  className,
}: {
  videoId: string;
  title: string;
  cover: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div
        className={`aspect-video overflow-hidden rounded-2xl ${className ?? ""}`}
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Reproducir: ${title}`}
      className={`group relative block aspect-video w-full cursor-pointer overflow-hidden rounded-2xl border border-white/10 text-left ${className ?? ""}`}
    >
      <Image
        src={cover}
        alt=""
        fill
        sizes="(min-width: 768px) 768px, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      {/* Oscurece la tapa para que el ▶ se lea arriba. */}
      <span className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/25" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary transition-transform duration-300 group-hover:scale-110 md:h-20 md:w-20">
          <svg
            viewBox="0 0 24 24"
            className="ml-1 h-7 w-7 fill-current"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
