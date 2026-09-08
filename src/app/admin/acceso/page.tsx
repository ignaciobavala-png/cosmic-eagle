import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { contentAccessLabel } from "@/lib/content-access";
import { CodeForm } from "./CodeForm";
import { RevokeGrantButton, ToggleCodeButton } from "./AccessButtons";

/**
 * Acceso a contenidos: los codigos y las habilitaciones. Ver docs/BIBLIOTECA.md
 * §3 y la migracion 20260908160000_content_access_levels.sql.
 *
 * El nivel que pide CADA texto no se toca acá: se elige al cargar el contenido,
 * en /admin/contenidos. Esta seccion decide *quien* alcanza los niveles.
 */
export default async function AdminAccesoPage() {
  const supabase = await createClient();

  const [{ data: codes }, { data: grants }, { data: trips }] = await Promise.all([
    supabase
      .from("access_codes")
      .select("id, code, label, level, max_uses, expires_at, is_active, trip_id")
      .order("created_at", { ascending: false }),
    supabase
      .from("content_grants")
      .select(
        "id, user_id, level, note, granted_at, expires_at, access_code_id, application_id"
      )
      .is("revoked_at", null)
      .order("granted_at", { ascending: false }),
    supabase
      .from("trips")
      .select("id, title")
      .order("start_date", { ascending: false }),
  ]);

  // `content_grants.user_id` referencia `auth.users`, no `profiles`, asi que
  // PostgREST no puede embeber el perfil: se cruza acá, con una sola consulta.
  const userIds = [...new Set((grants ?? []).map((g) => g.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds)
    : { data: [] };

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const usesByCode = new Map<string, number>();
  for (const grant of grants ?? []) {
    if (!grant.access_code_id) continue;
    usesByCode.set(
      grant.access_code_id,
      (usesByCode.get(grant.access_code_id) ?? 0) + 1
    );
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl text-primary-fixed-dim sm:text-3xl">
        Acceso a contenidos
      </h1>
      <p className="mb-10 max-w-2xl text-sm text-on-surface-variant">
        Quién puede leer los contenidos del programa. <strong>No hay que
        habilitar a nadie a mano</strong>: al aprobar una solicitud, esa persona
        queda habilitada sola. Los códigos de acá son para quien no pasó por la
        plataforma —las que ya ceremoniaron con ustedes antes de la web—. Qué
        nivel pide cada texto se elige en{" "}
        <Link
          href="/admin/contenidos"
          className="text-secondary hover:underline"
        >
          Contenidos
        </Link>
        .
      </p>

      <section className="mb-14">
        <h2 className="font-display text-lg text-on-surface">Códigos</h2>
        <p className="mb-4 max-w-2xl text-sm text-on-surface-variant">
          Un código por grupo o por experiencia. Se lo pasás a quienes viajan y
          cada persona lo escribe una vez, con su cuenta abierta: eso la habilita.
          Apagarlo corta la entrada de gente nueva, pero no le saca el acceso a
          quien ya lo canjeó.
        </p>

        <div className="mb-6">
          <CodeForm trips={trips ?? []} />
        </div>

        {(codes?.length ?? 0) === 0 ? (
          <p className="glass-card rounded-2xl px-5 py-4 text-sm text-on-surface-variant">
            Todavía no hay ningún código.
          </p>
        ) : (
          <ul className="space-y-3">
            {codes!.map((code) => {
              const used = usesByCode.get(code.id) ?? 0;
              const expired =
                code.expires_at != null && new Date(code.expires_at) <= new Date();

              return (
                <li key={code.id} className="glass-card rounded-2xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display tracking-[0.08em] text-on-surface">
                        {code.code}
                      </p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {code.label ?? "Sin descripción"} · habilita{" "}
                        {contentAccessLabel(code.level)} · {used} de{" "}
                        {code.max_uses ?? "∞"} usos
                        {code.expires_at &&
                          ` · vence el ${new Date(code.expires_at).toLocaleDateString("es-CL")}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-sm">
                      {(!code.is_active || expired) && (
                        <span className="rounded-full border border-outline px-3 py-1 text-xs text-on-surface-variant">
                          {expired ? "Vencido" : "Apagado"}
                        </span>
                      )}
                      <ToggleCodeButton
                        id={code.id}
                        isActive={code.is_active}
                        code={code.code}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg text-on-surface">
          Personas habilitadas
        </h2>
        <p className="mb-4 max-w-2xl text-sm text-on-surface-variant">
          Las que quedaron habilitadas al aprobarles la solicitud, las que
          entraron con un código y las que habilitaste a mano. Para quitarle el
          acceso a alguien, el botón está acá o en su solicitud, en{" "}
          <Link
            href="/admin/solicitudes"
            className="text-secondary hover:underline"
          >
            Solicitudes
          </Link>
          .
        </p>

        {(grants?.length ?? 0) === 0 ? (
          <p className="glass-card rounded-2xl px-5 py-4 text-sm text-on-surface-variant">
            Todavía no hay nadie habilitado — no hay ninguna solicitud aprobada.
            Cualquier persona con cuenta ve los contenidos marcados como «Con
            cuenta»; los del programa, no.
          </p>
        ) : (
          <ul className="space-y-3">
            {grants!.map((grant) => {
              const profile = byId.get(grant.user_id);
              const who =
                profile?.full_name ?? profile?.email ?? "Cuenta sin nombre";

              return (
                <li key={grant.id} className="glass-card rounded-2xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-on-surface">{who}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {contentAccessLabel(grant.level)} · desde el{" "}
                        {new Date(grant.granted_at).toLocaleDateString("es-CL")}
                        {grant.expires_at &&
                          ` · hasta el ${new Date(grant.expires_at).toLocaleDateString("es-CL")}`}
                        {grant.note && ` · ${grant.note}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-sm">
                      <Link
                        href={`/admin/crm/${grant.user_id}`}
                        className="text-secondary hover:underline"
                      >
                        Historial
                      </Link>
                      <RevokeGrantButton id={grant.id} who={who} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
