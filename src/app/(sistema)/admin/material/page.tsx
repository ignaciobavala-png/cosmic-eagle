import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteMaterialButton } from "./DeleteMaterialButton";
import { ShareMaterialButton } from "./ShareMaterialButton";

/**
 * Listado de "Envio material". El link de cada documento esta siempre a mano
 * en la fila: la idea es copiarlo y mandarlo, no entrar a buscarlo.
 */
export default async function AdminMaterialPage() {
  const supabase = await createClient();
  const { data: materiales } = await supabase
    .from("materiales")
    .select("id, title, eyebrow, cover_url, share_token, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-primary-fixed-dim">
          Envío material
        </h1>
        <Link
          href="/admin/material/nuevo"
          className="bg-primary-container text-on-primary font-medium tracking-[0.05em] rounded-lg px-4 py-2.5 text-sm whitespace-nowrap hover:bg-primary-fixed transition-colors"
        >
          Nuevo documento
        </Link>
      </div>

      <p className="mb-8 max-w-2xl text-sm text-on-surface-variant">
        Arma un documento con el formato del cuaderno de preparación: subes las
        fotos, escribes el texto y se genera solo, con tapa, índice y
        columnas. Con &ldquo;Compartir&rdquo; se copia un link para mandar:
        quien lo abre lo lee y lo puede guardar como PDF, sin cuenta.
      </p>

      {!materiales || materiales.length === 0 ? (
        <p className="text-on-surface-variant">
          Todavía no hay documentos. Crea el primero con &ldquo;Nuevo
          documento&rdquo;.
        </p>
      ) : (
        <div className="glass-card rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-left text-on-surface-variant">
                <th className="px-5 py-3 font-medium">Documento</th>
                <th className="px-5 py-3 font-medium">Actualizado</th>
                <th className="px-5 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materiales.map((material) => (
                <tr
                  key={material.id}
                  className="border-b border-outline-variant/40 last:border-0"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-surface-container-lowest">
                        {material.cover_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={material.cover_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-on-surface font-medium">
                          {material.title}
                        </p>
                        {material.eyebrow && (
                          <p className="text-on-surface-variant text-xs">
                            {material.eyebrow}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant whitespace-nowrap">
                    {new Date(material.updated_at).toLocaleDateString("es", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-4">
                      <ShareMaterialButton
                        id={material.id}
                        initialToken={material.share_token}
                      />
                      <Link
                        href={`/admin/material/${material.id}/editar`}
                        className="text-secondary hover:underline"
                      >
                        Editar
                      </Link>
                      <DeleteMaterialButton
                        id={material.id}
                        title={material.title}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
