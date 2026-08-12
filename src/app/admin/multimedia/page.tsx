import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { SITE_GROUPS, SITE_SLOTS, getSiteOverrides } from "@/lib/site-content";
import { SlotEditor } from "./SlotEditor";

export const metadata = { title: "Multimedia | Admin" };

/**
 * Imagenes y textos del sitio, editables sin tocar el codigo.
 *
 * Los slots salen del registro (src/lib/site-content.ts), no de la base: una
 * seccion nueva aparece aca sola con solo agregarla al registro. La base solo
 * guarda los overrides, por eso cada slot muestra si esta editado y puede
 * volver al original.
 */
export default async function AdminMultimediaPage() {
  const overrides = await getSiteOverrides();
  const editedCount = SITE_SLOTS.filter((slot) => overrides[slot.key]).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-primary-fixed-dim">
          Multimedia
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
          Las imágenes y los textos de las páginas públicas. Lo que cambies acá
          se ve en el sitio enseguida.{" "}
          {editedCount > 0
            ? `${editedCount} ${editedCount === 1 ? "elemento está editado" : "elementos están editados"}.`
            : "Todavía está todo con el contenido original."}
        </p>
      </div>

      <div className="space-y-8">
        {SITE_GROUPS.map((group) => (
          <section key={group.id} className="glass-card rounded-2xl">
            <header className="flex items-center justify-between gap-4 border-b border-outline-variant/40 px-5 py-4 md:px-6">
              <h2 className="font-display text-xl text-primary-fixed-dim">
                {group.title}
              </h2>
              <Link
                href={group.href}
                target="_blank"
                className="flex shrink-0 items-center gap-1.5 text-xs text-on-surface-variant transition-colors hover:text-primary-fixed-dim"
              >
                Ver en el sitio
                <ExternalLink size={13} />
              </Link>
            </header>

            <div>
              {group.slots.map((slot) => (
                <SlotEditor
                  key={slot.key}
                  slot={slot}
                  value={overrides[slot.key] ?? slot.fallback}
                  edited={Boolean(overrides[slot.key])}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-8 text-xs text-on-surface-variant">
        Las imágenes se achican y se convierten solas antes de subirse, así que
        podés cargar la foto tal cual sale de la cámara.
      </p>
    </div>
  );
}
