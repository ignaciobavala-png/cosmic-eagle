"use client";

import { useCallback, useRef, useState } from "react";
import { CENTER_FOCUS, compressImage, type CropFocus } from "@/lib/compress-image";

/**
 * El ciclo completo de una portada en el panel: elegir archivo, encuadrarlo y
 * dejar el recorte metido en el `<input type="file">` que se va a subir.
 *
 * Lo comparten los tres lugares que recortan (portada de contenido, portada de
 * experiencia y el editor de portadas de Multimedia), que hasta el 14/09 tenian
 * las mismas veinte lineas copiadas. `SlotEditor` queda afuera a proposito: no
 * recorta, cada slot conserva su proporcion.
 *
 * **El input lleva el archivo recortado, no el original**: es el que viaja en el
 * submit. Por eso hay que bloquear el guardado mientras `working` — si no, un
 * submit disparado en medio del recorte sube el encuadre anterior.
 */
export function useCoverCrop({
  aspect,
  maxPx,
  inputRef,
}: {
  aspect: number;
  maxPx: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  /** El archivo ORIGINAL, que es sobre el que se reencuadra. */
  const [source, setSource] = useState<{ file: File; url: string } | null>(null);
  const [focus, setFocus] = useState<CropFocus>(CENTER_FOCUS);
  const [preview, setPreview] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  // Cada recorte se numera y solo el ultimo pedido escribe. Arrastrando se
  // encadenan varios y `compressImage` no garantiza que terminen en orden: sin
  // esto, un recorte viejo puede pisar al nuevo en el input que se sube.
  const seq = useRef(0);
  const urls = useRef<string[]>([]);

  const remember = useCallback((url: string) => {
    urls.current.push(url);
    return url;
  }, []);

  const crop = useCallback(
    async (file: File, next: CropFocus) => {
      const mine = ++seq.current;
      setWorking(true);

      const cover = await compressImage(file, maxPx, aspect, next);
      if (mine !== seq.current) return; // llego tarde: manda el arrastre siguiente

      const transfer = new DataTransfer();
      transfer.items.add(cover);
      if (inputRef.current) inputRef.current.files = transfer.files;

      setPreview(remember(URL.createObjectURL(cover)));
      setWorking(false);
    },
    [aspect, maxPx, inputRef, remember]
  );

  /** `onChange` del input de archivo. */
  const pick = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Se arranca siempre centrado, que es como se comporto siempre; el
      // encuadre es una correccion opcional, no un paso obligatorio.
      setSource({ file, url: remember(URL.createObjectURL(file)) });
      setFocus(CENTER_FOCUS);
      await crop(file, CENTER_FOCUS);
    },
    [crop, remember]
  );

  /** Props listas para `<CoverFramer {...framerProps} />`. */
  const framerProps = source
    ? {
        src: source.url,
        aspect,
        focus,
        onFocusChange: setFocus,
        onCommit: (next: CropFocus) => {
          setFocus(next);
          void crop(source.file, next);
        },
      }
    : null;

  /** Vuelve al estado inicial y suelta los `blob:` creados. */
  const reset = useCallback(() => {
    seq.current++;
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current = [];
    setSource(null);
    setPreview(null);
    setFocus(CENTER_FOCUS);
    setWorking(false);
  }, []);

  return { preview, working, framerProps, pick, reset };
}
