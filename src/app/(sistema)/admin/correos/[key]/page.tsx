import Link from "next/link";
import { notFound } from "next/navigation";
import { getCopyOverrides } from "@/lib/email/copy-store";
import { getTemplateDef } from "@/lib/email/templates";
import { PREVIEWS } from "@/lib/email/previews";
import { EmailEditor } from "./EmailEditor";

export default async function AdminCorreoPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const def = getTemplateDef(key);
  if (!def) notFound();

  const overrides = (await getCopyOverrides(key)) ?? {};
  const previews = Object.entries(PREVIEWS)
    .filter(([, p]) => p.template === key)
    .map(([id, p]) => ({ id, titulo: p.titulo }));

  return (
    <div>
      <Link
        href="/admin/correos"
        className="text-sm text-on-surface-variant hover:text-on-surface"
      >
        ← Todos los correos
      </Link>
      <h1 className="mb-1 mt-3 font-display text-2xl text-primary-fixed-dim sm:text-3xl">
        {def.code} {def.label}
      </h1>
      <p className="mb-8 text-sm text-on-surface-variant">{def.when}</p>
      <EmailEditor def={def} overrides={overrides} previews={previews} />
    </div>
  );
}
