"use client";

import { useTranslations } from "next-intl";
import { useSignedIn } from "@/lib/use-signed-in";
import { CtaLink } from "./CtaLink";

/**
 * Aviso para quien llega a un contenido cerrado sin haber iniciado sesión.
 *
 * Sin esto el muro dice "tu cuenta todavía no alcanza" o habla del programa, y
 * alguien que ni siquiera tiene cuenta lo lee como un error de la página. Sólo
 * se dibuja con `signedIn === false`: mientras la sesión no se sabe (`null`) no
 * aparece, para no mostrarle un pedido de registro a quien ya está adentro.
 *
 * `next` vuelve a la persona a este mismo contenido después de entrar.
 */
export function GuestNotice({ next }: { next: string }) {
  const t = useTranslations("Contenidos.library");
  const signedIn = useSignedIn();

  if (signedIn !== false) return null;

  const query = `next=${encodeURIComponent(next)}`;

  return (
    <div
      role="note"
      className="mx-auto mb-6 max-w-md rounded-2xl border border-[#f9d78f] bg-white px-5 py-5 text-center"
    >
      <p className="font-display text-lg text-[#05125a]">{t("guestTitle")}</p>
      <p className="mt-2 text-body-md text-[#05125a]">{t("guestBody")}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <CtaLink href={`/cuenta?modo=registro&${query}`} tone="dark">
          {t("guestSignup")}
        </CtaLink>
        <CtaLink href={`/cuenta?${query}`} tone="dark">
          {t("guestLogin")}
        </CtaLink>
      </div>
    </div>
  );
}
