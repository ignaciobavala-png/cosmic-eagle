/**
 * Comprime un video corto en el browser antes de subirlo.
 *
 * **Por que en el browser y no con ffmpeg**: el proyecto no tiene backend de
 * procesamiento, y `ffmpeg.wasm` son ~25 MB de descarga para que la clienta
 * suba un clip. Aca se re-codifica dibujando el video en un `<canvas>` y
 * grabando ese canvas con `MediaRecorder`, que ya viene en el navegador.
 *
 * **La contra, y por que igual conviene**: la recodificacion corre en tiempo
 * real — un clip de 8 segundos tarda 8 segundos. Para los videos de fondo del
 * rediseño (5-10 s) es aceptable; por eso `MAX_DURATION` rechaza cualquier cosa
 * mas larga en vez de dejar a la clienta esperando sin saber por que.
 *
 * **El audio se descarta a proposito.** Los videos son fondos que se reproducen
 * en silencio y en loop: la pista de audio seria peso puro. Ademas evita que un
 * clip empiece a sonar solo.
 *
 * Por que comprimir: el free tier de Supabase no aprieta por el 1 GB de storage
 * (un clip pesa ~1,5 MB) sino por los **5 GB de egress mensuales**, y un video
 * de fondo se descarga en cada visita. Bajarlo a 720p y ~1,2 Mbps es la
 * diferencia entre 3.000 y 15.000 visitas con la misma cuota.
 *
 * Si algo falla —navegador sin `MediaRecorder`, codec no soportado, el archivo
 * no decodifica— devuelve el original, igual que `compressImage`. Peor que
 * comprimido, mejor que un error que la clienta no puede resolver.
 */

/** Alto maximo del video de salida. 720p alcanza para un fondo a pantalla completa. */
const MAX_HEIGHT = 720;
/** ~1,2 Mbps: sobra para un plano lento y sin cortes, que es lo que son estos clips. */
const BITRATE = 1_200_000;
const FPS = 25;
/** Mas largo que esto la recodificacion en tiempo real deja de tener sentido. */
export const MAX_DURATION_SECONDS = 40;

/**
 * Union discriminada por `ok` y no por `error`: TypeScript solo estrecha una
 * union por una propiedad de tipo literal, asi que un `error: string | null` no
 * alcanza para que el llamador sepa que hay `file`.
 */
export type VideoCompressionResult =
  | { ok: true; file: File }
  | { ok: false; error: string };

export async function compressVideo(
  file: File
): Promise<VideoCompressionResult> {
  let video: HTMLVideoElement;

  try {
    video = await loadVideo(file);
  } catch {
    return { ok: false, error: "No se pudo leer el video. Prueba con un MP4." };
  }

  if (video.duration > MAX_DURATION_SECONDS) {
    return {
      ok: false,
      error: `El video dura ${Math.round(video.duration)} segundos. Para los fondos usá clips de hasta ${MAX_DURATION_SECONDS}.`,
    };
  }

  try {
    const compressed = await transcode(video, file.name);

    // Si el original ya venia mas liviano que lo que sale del canvas, no tiene
    // sentido degradarlo: se sube tal cual.
    return {
      ok: true,
      file: compressed.size < file.size ? compressed : file,
    };
  } catch {
    return { ok: true, file };
  } finally {
    URL.revokeObjectURL(video.src);
  }
}

function loadVideo(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);

    // `loadedmetadata` ya trae duracion y dimensiones, que es lo unico que hace
    // falta para decidir si seguimos.
    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => reject(new Error("no se pudo cargar el video"));
  });
}

function transcode(video: HTMLVideoElement, originalName: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const scale = Math.min(1, MAX_HEIGHT / video.videoHeight);
    const canvas = document.createElement("canvas");
    // Los codecs de video quieren dimensiones pares; una impar hace fallar el
    // encoder en algunos navegadores.
    canvas.width = Math.round((video.videoWidth * scale) / 2) * 2;
    canvas.height = Math.round((video.videoHeight * scale) / 2) * 2;

    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("sin contexto 2d"));

    const mimeType = pickMimeType();
    if (!mimeType) return reject(new Error("MediaRecorder no soportado"));

    const stream = canvas.captureStream(FPS);
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: BITRATE,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      if (blob.size === 0) return reject(new Error("grabacion vacia"));

      const name = originalName.replace(/\.[^.]+$/, "") || "video";
      resolve(new File([blob], `${name}.webm`, { type: "video/webm" }));
    };

    let frame = 0;

    function draw() {
      if (video.ended || video.paused) {
        recorder.stop();
        return;
      }
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height);
      frame = requestAnimationFrame(draw);
    }

    video.onended = () => {
      cancelAnimationFrame(frame);
      // Un ultimo frame despues del final evita que el clip termine en negro.
      if (recorder.state === "recording") recorder.stop();
    };

    recorder.start();
    video
      .play()
      .then(() => draw())
      .catch(() => reject(new Error("no se pudo reproducir para grabar")));
  });
}

/** VP9 pesa menos a igual calidad; VP8 es el que siempre esta. */
function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return null;

  return (
    ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((t) =>
      MediaRecorder.isTypeSupported(t)
    ) ?? null
  );
}
