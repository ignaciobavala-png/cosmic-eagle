import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isLegalSlug, legalDocumentMeta } from "@/lib/legal";
import { LegalForm } from "../LegalForm";

export default async function EditarLegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isLegalSlug(slug)) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("legal_documents")
    .select("slug, title, body, is_provisional")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) notFound();

  const meta = legalDocumentMeta(slug);

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/legales"
        className="inline-flex items-center gap-2 text-body-md text-primary-fixed-dim"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver
      </Link>

      <h1 className="mt-4 font-display text-headline-lg text-primary-fixed-dim">
        {meta.label}
      </h1>
      <p className="mt-2 text-body-md text-on-surface/75">{meta.descripcion}</p>

      <div className="mt-8">
        <LegalForm
          slug={data.slug}
          href={meta.href}
          title={data.title}
          body={data.body}
          isProvisional={data.is_provisional}
        />
      </div>
    </div>
  );
}
