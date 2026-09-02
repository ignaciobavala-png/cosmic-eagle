"use client";

import { useActionState, useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { compressImage } from "@/lib/compress-image";
import { uploadPaymentProof, type PaymentProofState } from "./actions";

const initialState: PaymentProofState = { error: null };

/**
 * Subida del comprobante de pago.
 *
 * Las fotos se comprimen en el browser antes de salir, con el mismo helper que
 * las portadas: un comprobante fotografiado con el celular puede pesar 6MB y no
 * pasaría el tope del bucket. **Sin recorte** (`aspect` vacío) — recortar un
 * papel por el centro le come los datos de los bordes. Los PDF se suben tal
 * cual: `compressImage` es de canvas y no los entiende.
 */
export function PaymentProofUpload({
  tripId,
  applicationId,
  yaSubio,
}: {
  tripId: string;
  applicationId: string;
  yaSubio: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    uploadPaymentProof.bind(null, tripId, applicationId),
    initialState
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preparando, setPreparando] = useState(false);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFileName(file.name);
      return;
    }

    setPreparando(true);
    const compressed = await compressImage(file, 2000);
    // El input se reescribe con el archivo liviano para que el `<form>` mande
    // ese y no el original: es la misma maniobra del panel de multimedia.
    const transfer = new DataTransfer();
    transfer.items.add(compressed);
    if (inputRef.current) inputRef.current.files = transfer.files;
    setFileName(compressed.name);
    setPreparando(false);
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label
          htmlFor="proof"
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary-container/55 px-4 py-2.5 text-sm font-medium text-primary-container transition-colors hover:bg-primary-container/10"
        >
          <Paperclip size={15} />
          {yaSubio ? "Subir otro comprobante" : "Elegir el comprobante"}
        </label>
        <input
          ref={inputRef}
          id="proof"
          name="proof"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
          required
          className="sr-only"
          onChange={onPick}
        />
        {fileName && (
          <p className="mt-2 text-sm text-on-surface-variant">{fileName}</p>
        )}
        <p className="mt-2 text-xs text-on-surface-variant">
          Una foto, una captura o el PDF del banco. Hasta 5MB.
        </p>
      </div>

      <div>
        <label
          htmlFor="note"
          className="mb-1.5 block text-sm text-on-surface-variant"
        >
          ¿Querés aclarar algo? (opcional)
        </label>
        <input
          id="note"
          name="note"
          placeholder="Transferí la primera mitad"
          className="w-full rounded-lg border border-outline bg-surface-container px-4 py-2.5 text-on-surface outline-none focus:border-primary-fixed-dim"
        />
      </div>

      {state.error && (
        <p className="text-sm text-error" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || preparando}
        className="rounded-lg bg-primary-container px-5 py-2.5 font-medium tracking-[0.05em] text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-60"
      >
        {preparando
          ? "Preparando el archivo..."
          : pending
            ? "Enviando..."
            : "Enviar comprobante"}
      </button>
    </form>
  );
}
