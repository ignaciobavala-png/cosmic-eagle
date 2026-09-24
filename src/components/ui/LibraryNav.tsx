import Link from "next/link";
import { ARTICLE_CATEGORY_LIST } from "@/lib/article";
import { CTA_TONES } from "./CtaLink";

/**
 * Menú de los cinco temas de la biblioteca, como links.
 *
 * Es la versión de la ficha de un contenido: la persona llegó de un link
 * directo (la tarjeta, el buscador, el panel) y este menú le deja volver al
 * listado del tema o saltar a otro sin pasar por el inicio. La biblioteca de
 * `/contenidos` no usa este componente: ahí el menú es de estado (no navega) y
 * vive dentro de `ContentLibrary`.
 *
 * Va como barra de crema flotante (`sticky`) debajo del navbar, igual que el
 * menú de `/contenidos`, para que las dos pantallas se lean como la misma
 * biblioteca. El ancestro no puede tener `overflow-hidden`.
 */
export function LibraryNav({ active }: { active: string }) {
  return (
    <nav
      aria-label="Temas de la biblioteca"
      className="sticky top-[var(--navbar-h)] z-30 mx-auto w-full max-w-3xl rounded-2xl border border-[#b3964b]/40 bg-[#fff6eb]/95 px-3 py-3 shadow-[0_10px_30px_-16px_rgba(5,18,90,0.55)] backdrop-blur-sm sm:px-4"
    >
      <ul className="flex flex-nowrap justify-start gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] md:flex-wrap md:justify-center md:overflow-visible [&::-webkit-scrollbar]:hidden">
        {ARTICLE_CATEGORY_LIST.map((category) => {
          const isActive = active === category.value;
          return (
            <li key={category.value}>
              <Link
                href={`/contenidos?categoria=${category.value}`}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center whitespace-nowrap rounded-full border-[1.5px] px-4 py-2 text-label-sm uppercase transition-[color,background-color,border-color,box-shadow,transform] duration-[250ms] md:px-5 ${
                  isActive
                    ? "border-[#05125a] bg-[#05125a] text-[#fff6eb]"
                    : `hover:scale-[1.04] ${CTA_TONES.dark}`
                }`}
              >
                {category.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
