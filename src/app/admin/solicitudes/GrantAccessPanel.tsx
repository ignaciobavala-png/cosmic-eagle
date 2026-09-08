"use client";

import {
  grantProgramAccess,
  revokeContentGrant,
} from "@/app/admin/acceso/actions";

/**
 * Estado del acceso a contenidos de esta persona. **No es un formulario**: al
 * aprobar la solicitud queda habilitada sola (trigger
 * `private.grant_content_on_approval`), asi que lo normal es que este panel solo
 * informe. Los botones son para las dos excepciones: quitarle el acceso, o
 * darselo a alguien cuya solicitud todavia no esta aprobada.
 */
export function GrantAccessPanel({
  applicationId,
  userId,
  fullName,
  approved,
  grant,
}: {
  applicationId: string;
  userId: string;
  fullName: string;
  approved: boolean;
  grant: { id: string; granted_at: string; note: string | null } | null;
}) {
  if (grant) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">
          Habilitada desde el{" "}
          {new Date(grant.granted_at).toLocaleDateString("es-CL")}
          {grant.note && ` · ${grant.note}`}. Lee todos los contenidos del
          programa.
        </p>
        <form
          action={revokeContentGrant.bind(null, grant.id)}
          onSubmit={(event) => {
            if (
              !confirm(
                `¿Quitarle el acceso a ${fullName}? No se le vuelve a dar solo, ni siquiera si aprobás otra solicitud suya.`
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <button type="submit" className="text-sm text-error hover:underline">
            Quitar el acceso
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-on-surface-variant">
        {approved
          ? "No tiene acceso: se lo quitaron a mano."
          : "Todavía no. Se habilita sola en cuanto apruebes la solicitud."}
      </p>
      <form action={grantProgramAccess.bind(null, userId, applicationId)}>
        <button
          type="submit"
          className="rounded-lg bg-primary-container px-6 py-2.5 text-sm font-medium tracking-[0.05em] text-on-primary transition-colors hover:bg-primary-fixed"
        >
          Habilitar igual
        </button>
      </form>
    </div>
  );
}
