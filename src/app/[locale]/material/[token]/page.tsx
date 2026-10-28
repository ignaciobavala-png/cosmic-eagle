import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { MaterialDocument } from "@/components/material/MaterialDocument";
import { PrintButton } from "@/components/material/PrintButton";
import { createClient } from "@/lib/supabase/server";
import { parseMaterialBlocks } from "@/lib/material";

/**
 * Un documento de "Envio material" abierto por link (28/10): el admin lo
 * comparte desde `/admin/material` y quien recibe el link lo lee entero y lo
 * puede guardar como PDF, sin cuenta.
 *
 * La lectura es la funcion `shared_material(token)` (`security definer`): quien
 * abre el link no puede leer la tabla, y la funcion devuelve solo lo que se
 * muestra. Un token que no existe —o que se dejo de compartir— da 404.
 *
 * **Es dinamica a proposito** (el cliente `server` lee cookies): si quedara en
 * cache, "Dejar de compartir" no cortaria el link. Y **no se indexa**: el link
 * es para quien lo recibe, no para el buscador. Tampoco lleva el chrome del
 * sitio (header, footer): es un documento, no una pagina.
 */
async function getShared(token: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("shared_material", { p_token: token });
  return data?.[0] ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const material = await getShared(token);
  return {
    title: material ? `${material.title} | Cosmic Eagle` : "Cosmic Eagle",
    robots: { index: false, follow: false },
  };
}

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const material = await getShared(token);
  if (!material) notFound();

  return (
    // `relative z-10` + fondo opaco: el `body` del sitio lleva un degradé y un
    // campo de estrellas fijo, y un documento tiene que leerse sobre papel.
    // Al imprimir, ni el fondo gris ni el padding: la tapa va a sangre y la
    // hoja ocupa el ancho de la pagina A4.
    <main className="relative z-10 min-h-screen bg-[#e8e8ee] px-0 py-6 sm:px-4 sm:py-10 print:min-h-0 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[820px] justify-end px-4 sm:px-0">
        <PrintButton />
      </div>
      <MaterialDocument
        title={material.title}
        eyebrow={material.eyebrow}
        coverUrl={material.cover_url}
        backCoverUrl={material.back_cover_url}
        blocks={parseMaterialBlocks(material.blocks)}
      />
    </main>
  );
}
