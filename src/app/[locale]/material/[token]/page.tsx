import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { HtmlFrame } from "@/components/ui/HtmlFrame";
import { createClient } from "@/lib/supabase/server";

/**
 * Un documento HTML de "Envio material" abierto por link (29/10): el admin lo
 * sube y lo comparte desde `/admin/material`, y quien recibe el link lo lee sin
 * cuenta. El HTML va en `HtmlFrame` (iframe aislado).
 *
 * La lectura es la funcion `shared_material(token)` (`security definer`). Un
 * token que no existe —o que se dejo de compartir— da 404.
 *
 * **Dinamica a proposito** (el cliente `server` lee cookies): si quedara en
 * cache, "Dejar de compartir" no cortaria el link. Y **no se indexa**. Sin el
 * chrome del sitio: es un documento, no una pagina.
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
    // Fondo opaco: el `body` del sitio lleva degradé y estrellas fijas.
    <main className="relative z-10 min-h-screen bg-white">
      <HtmlFrame html={material.html} title={material.title} />
    </main>
  );
}
