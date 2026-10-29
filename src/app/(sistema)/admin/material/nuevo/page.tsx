import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MaterialForm } from "../MaterialForm";
import { createMaterial } from "../actions";

export default function NuevoMaterialPage() {
  return (
    <div>
      <Link
        href="/admin/material"
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Envío material
      </Link>
      <h1 className="font-display text-3xl text-primary-fixed-dim mb-8">
        Subir documento
      </h1>
      <MaterialForm action={createMaterial} />
    </div>
  );
}
