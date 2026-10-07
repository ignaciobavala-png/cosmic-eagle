"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * `ES / EN`: lleva a la MISMA pagina en el otro idioma. El `usePathname` es el
 * de next-intl, que devuelve la ruta sin el prefijo `/en`.
 *
 * El `display` lo pone quien lo usa (`hidden md:flex` en el navbar): un `flex`
 * fijo aca competiria con ese `hidden` y ganaria por orden de la hoja.
 */
export function LocaleSwitch({
  className = "flex",
  large = false,
}: {
  className?: string;
  /** El del drawer mobile: más grande y más junto (Sofía, 06/10). */
  large?: boolean;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("LocaleSwitch");

  return (
    <nav aria-label={t("label")} className={`items-center ${large ? "gap-1" : "gap-1.5"} ${className}`}>
      {routing.locales.map((l, i) => (
        <span key={l} className={`flex items-center ${large ? "gap-1" : "gap-1.5"}`}>
          {i > 0 && <span aria-hidden="true" className="text-primary/40">/</span>}
          <Link
            href={pathname}
            locale={l}
            aria-current={l === locale ? "true" : undefined}
            className={`font-display uppercase transition-colors ${
              large ? "text-[17px] tracking-[0.08em]" : "text-[14px] leading-4 tracking-[0.1em]"
            } duration-300 ${
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
