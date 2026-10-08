"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "site-assets";

/**
 * El audio opcional de un contenido (08/10, el guion del video de bienvenida).
 *
 * **Sube desde el browser, directo a Storage**, y al form sólo viaja la URL en
 * un campo oculto. Si el archivo pasara por el server action se toparía con el
 * tope de ~4,5MB del cuerpo de una función de Vercel — es lo que tiene roto el
 * uploader de video de Multimedia —, y el primer audio ya pesa 4,3MB. La
 * escritura en `site-assets` es sólo admin por RLS, igual que las portadas.
 *
 * El archivo viejo no se borra acá: lo borra el server action al guardar, que
 * es cuando el cambio se confirma. Si la clienta sube uno y cancela, queda un
 * huérfano en el bucket — es el costo de no pasar el archivo por el server.
 */
export function AudioField({
  labelClass,
  initialUrl,
}: {
  labelClass: string;
  initialUrl: string | null;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");

  async function upload(file: File) {
    setStatus("uploading");
    const ext = file.name.split(".").pop()?.toLowerCase() || "m4a";
    const path = `articles/audio/${crypto.randomUUID()}.${ext}`;
    const supabase = createClient();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || "audio/mp4" });

    if (error) {
      setStatus("error");
      return;
    }

    setUrl(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    setStatus("idle");
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="audio" className={labelClass}>
        Audio (opcional)
      </label>
      <input type="hidden" name="audio_url" value={url} />
      {url && (
        <div className="flex flex-wrap items-center gap-3">
          <audio controls preload="none" src={url} className="w-full max-w-md" />
          <button
            type="button"
            onClick={() => setUrl("")}
            className="text-sm text-on-surface-variant underline underline-offset-4"
          >
            Quitar el audio
          </button>
        </div>
      )}
      <input
        id="audio"
        type="file"
        accept="audio/*,.m4a,.mp3,.mp4"
        disabled={status === "uploading"}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
        className="text-sm text-on-surface-variant file:mr-3 file:rounded-lg file:border file:border-outline-variant file:bg-surface-container-low file:px-3 file:py-1.5 file:text-sm file:text-on-surface-variant"
      />
      <p className="text-xs text-on-surface-variant">
        {status === "uploading" && "Subiendo el audio… espera a que termine antes de guardar. "}
        {status === "error" && "No se pudo subir el audio. Prueba de nuevo. "}
        {status === "idle" &&
          "Hasta 8MB (.m4a o .mp3). Se escucha arriba del texto, con un reproductor, y lo ve sólo quien puede leer el contenido."}
      </p>
    </div>
  );
}
