import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Los comprobantes que subió el postulante, con link firmado.
 *
 * El bucket `comprobantes` es privado (a diferencia de los otros tres del
 * proyecto), así que no hay URL pública que guardar: se firma una en cada
 * render y vence sola. Diez minutos alcanza para abrirla y no deja un link
 * eterno dando vueltas en el historial del browser.
 */
const SIGNED_URL_TTL = 60 * 10;

export async function PaymentProofList({ applicationId }: { applicationId: string }) {
  const supabase = await createClient();

  const { data: proofs } = await supabase
    .from("payment_proofs")
    .select("id, storage_path, note, created_at")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (!proofs?.length) {
    return (
      <p className="mb-5 text-sm text-on-surface-variant">
        Todavía no subió ningún comprobante.
      </p>
    );
  }

  const signed = await Promise.all(
    proofs.map(async (proof) => {
      const { data } = await supabase.storage
        .from("comprobantes")
        .createSignedUrl(proof.storage_path, SIGNED_URL_TTL);
      return { ...proof, url: data?.signedUrl ?? null };
    })
  );

  return (
    <ul className="mb-5 space-y-2">
      {signed.map((proof) => (
        <li key={proof.id}>
          <a
            href={proof.url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-lg border border-outline-variant/50 px-4 py-3 transition-colors hover:border-primary-fixed-dim/50"
          >
            <FileText size={16} className="mt-0.5 shrink-0 text-primary-fixed-dim" />
            <span className="min-w-0">
              <span className="block text-sm text-on-surface">
                Comprobante del{" "}
                {new Date(proof.created_at).toLocaleString("es-CL", {
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {proof.note && (
                <span className="block text-sm text-on-surface-variant">
                  “{proof.note}”
                </span>
              )}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
