"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * `ES · EN`: lleva a la MISMA pagina en el otro idioma. El `usePathname` es el
 * de next-intl, que devuelve la ruta sin el prefijo `/en`.
 *
 * El `display` lo pone quien lo usa (`hidden md:flex` en el navbar): un `flex`
 * fijo aca competiria con ese `hidden` y ganaria por orden de la hoja.
 */
export function LocaleSwitch({ className = "flex" }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("LocaleSwitch");

  return (
    <nav aria-label={t("label")} className={`items-center gap-1.5 ${className}`}>
      {routing.locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden="true" className="text-primary/40">·</span>}
          <Link
            href={pathname}
            locale={l}
            aria-current={l === locale ? "true" : undefined}
            className={`font-display text-label-sm uppercase transition-colors duration-300 ${
              l === locale
                ? "text-primary-fixed-dim"
                : "text-primary/60 hover:text-primary-fixed-dim"
            }`}
          >
            {l}
          </Link>
        </span>
      ))}
    </nav>
  );
}
