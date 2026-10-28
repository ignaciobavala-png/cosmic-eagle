import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MaterialForm } from "../../MaterialForm";
import { updateMaterial } from "../../actions";
import { ShareMaterialButton } from "../../ShareMaterialButton";

export default async function EditarMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: material } = await supabase
    .from("materiales")
    .select("*")
    .eq("id", id)
    .single();

  if (!material) notFound();

  return (
    <div>
      <Link
        href="/admin/material"
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Envío material
      </Link>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-display text-3xl text-primary-fixed-dim">
          Editar documento
        </h1>
        {/* El link, a mano en el editor: es lo que se busca despues de armarlo.
            Lo que se edite se ve en el link apenas se guarda. */}
        <ShareMaterialButton id={material.id} initialToken={material.share_token} />
      </div>
      <MaterialForm material={material} action={updateMaterial.bind(null, id)} />
    </div>
  );
}
