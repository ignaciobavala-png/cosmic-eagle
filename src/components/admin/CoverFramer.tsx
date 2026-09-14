"use client";

import { useRef, useState } from "react";
import type { CropFocus } from "@/lib/compress-image";

/**
 * Elegir que parte de la foto queda dentro de la portada.
 *
 * Muestra la imagen ENTERA y, encima, la ventana del recorte: lo de adentro es
 * lo que se guarda y lo de afuera se pierde. La ventana se arrastra (o se mueve
 * con las flechas del teclado) sobre el unico eje que sobra — recortando a 16:9,
 * una foto vertical solo se corre en `y` y una panoramica solo en `x`.
 *
 * **Reemplaza a la preview mientras hay un archivo nuevo elegido**, en vez de
 * sumarse a ella: las dos juntas mostrarian dos veces lo mismo, y la ventana ya
 * ES la preview del recorte.
 *
 * `onCommit` se dispara al SOLTAR y no en cada pixel del arrastre: cada commit
 * vuelve a pasar la foto por canvas, que con una imagen de celular tarda lo
 * suficiente como para que hacerlo por frame trabe el arrastre. Mientras tanto
 * el encuadre se ve en vivo, que es CSS y es gratis.
 */
export function CoverFramer({
  src,
  aspect,
  focus,
  onFocusChange,
  onCommit,
  className = "",
}: {
  /** `blob:` del archivo ORIGINAL, sin recortar. */
  src: string;
  /** Proporcion del recorte (ancho / alto). */
  aspect: number;
  focus: CropFocus;
  /** Durante el arrastre: solo mueve la ventana. */
  onFocusChange: (focus: CropFocus) => void;
  /** Al soltar: es cuando conviene rehacer el recorte de verdad. */
  onCommit: (focus: CropFocus) => void;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // Hasta que la imagen carga no se conoce su proporcion, asi que no se sabe
  // que eje sobra ni de que tamaño es la ventana.
  const imgAspect = size ? size.w / size.h : null;

  // Tolerancia: una foto que ya viene en la proporcion pedida no tiene ningun
  // eje libre, y sin ella el redondeo dejaria una ventana movible por medio
  // pixel, que se siente como un control roto.
  const vertical = imgAspect !== null && imgAspect < aspect - 0.001;
  const horizontal = imgAspect !== null && imgAspect > aspect + 0.001;
  const movable = vertical || horizontal;

  // Tamaño de la ventana como porcentaje de la imagen mostrada.
  const winW = horizontal && imgAspect ? (aspect / imgAspect) * 100 : 100;
  const winH = vertical && imgAspect ? (imgAspect / aspect) * 100 : 100;
  const left = horizontal ? focus.x * (100 - winW) : 0;
  const top = vertical ? focus.y * (100 - winH) : 0;

  function focusFromPointer(clientX: number, clientY: number): CropFocus {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box) return focus;

    // El puntero marca el CENTRO de la ventana, no su borde: agarrar la foto y
    // que el punto que se toca sea el que queda al medio es lo que hace que el
    // control se sienta directo.
    if (vertical) {
      const half = (winH / 100) * box.height / 2;
      const range = box.height - half * 2;
      if (range <= 0) return focus;
      return { ...focus, y: (clientY - box.top - half) / range };
    }
    const half = (winW / 100) * box.width / 2;
    const range = box.width - half * 2;
    if (range <= 0) return focus;
    return { ...focus, x: (clientX - box.left - half) / range };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!movable) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onFocusChange(clampFocus(focusFromPointer(event.clientX, event.clientY)));
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!movable || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    onFocusChange(clampFocus(focusFromPointer(event.clientX, event.clientY)));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!movable || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    onCommit(clampFocus(focusFromPointer(event.clientX, event.clientY)));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!movable) return;
    const step = event.shiftKey ? 0.1 : 0.02;
    const axis = vertical ? "y" : "x";
    const back = vertical ? "ArrowUp" : "ArrowLeft";
    const forward = vertical ? "ArrowDown" : "ArrowRight";

    let next: CropFocus | null = null;
    if (event.key === back) next = { ...focus, [axis]: focus[axis] - step };
    if (event.key === forward) next = { ...focus, [axis]: focus[axis] + step };
    if (event.key === "Home") next = { ...focus, [axis]: 0 };
    if (event.key === "End") next = { ...focus, [axis]: 1 };
    if (!next) return;

    event.preventDefault();
    const clamped = clampFocus(next);
    onFocusChange(clamped);
    onCommit(clamped);
  }

  const position = vertical ? focus.y : focus.x;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div
        ref={boxRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        role={movable ? "slider" : undefined}
        tabIndex={movable ? 0 : undefined}
        aria-label={
          vertical ? "Encuadre vertical de la portada" : "Encuadre horizontal de la portada"
        }
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={movable ? Math.round(position * 100) : undefined}
        aria-valuetext={
          movable ? posicionEnPalabras(position, vertical) : undefined
        }
        className={`relative w-full select-none overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest ${
          movable
            ? // Las dos clases van literales: Tailwind escanea el codigo fuente
              // buscando nombres completos, asi que `cursor-${eje}-resize` no
              // genera ninguna regla.
              `touch-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-fixed-dim ${
                vertical ? "cursor-ns-resize" : "cursor-ew-resize"
              }`
            : ""
        }`}
      >
        {/* <img> y no next/image: es un blob: local y el optimizador no lo puede
            resolver (mismo caso que las previews de los tres paneles). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Foto original, para elegir el encuadre"
          draggable={false}
          onLoad={(event) =>
            setSize({
              w: event.currentTarget.naturalWidth,
              h: event.currentTarget.naturalHeight,
            })
          }
          className="block w-full"
        />

        {size && (
          <div
            className="pointer-events-none absolute shadow-[0_0_0_9999px_rgba(5,6,10,0.62)]"
            style={{
              width: `${winW}%`,
              height: `${winH}%`,
              left: `${left}%`,
              top: `${top}%`,
            }}
          >
            <div className="absolute inset-0 border border-primary-container" />
            {/* Zona segura: lo que queda fuera del 75% central se pierde en
                alguno de los recortes de la pagina (ver docs/PORTADAS.md). */}
            <div className="absolute inset-[12.5%] border border-dashed border-primary-fixed-dim/70" />
          </div>
        )}
      </div>

      <p className="text-xs text-on-surface-variant">
        {movable
          ? `Arrastrá para elegir qué parte de la foto queda en la portada${
              vertical ? " (se mueve de arriba abajo)" : " (se mueve de lado a lado)"
            }. Lo de afuera del marco se descarta.`
          : "La foto ya viene en la proporción de la portada: no hay nada que recortar."}
      </p>
    </div>
  );
}

function clampFocus(focus: CropFocus): CropFocus {
  return {
    x: Math.min(1, Math.max(0, focus.x)),
    y: Math.min(1, Math.max(0, focus.y)),
  };
}

function posicionEnPalabras(position: number, vertical: boolean) {
  if (position < 0.2) return vertical ? "arriba" : "a la izquierda";
  if (position > 0.8) return vertical ? "abajo" : "a la derecha";
  if (position > 0.4 && position < 0.6) return "al centro";
  return vertical ? "entre el centro y el borde" : "entre el centro y el costado";
}
