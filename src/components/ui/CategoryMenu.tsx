"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CTA_TONES } from "./CtaLink";

export type CategoryMenuItem = {
  value: string;
  label: string;
  /** Con `href` cada opción navega (ficha de un contenido); sin él, avisa por `onChoose`. */
  href?: string;
};

const CHIP =
  "inline-flex items-center whitespace-nowrap rounded-full border-[1.5px] px-4 py-2 text-label-sm uppercase transition-[color,background-color,border-color,box-shadow,transform] duration-[250ms] md:px-5";

const ACTIVE = "border-[#05125a] bg-[#05125a] text-[#fff6eb]";

/**
 * El menú de los cinco temas de la biblioteca, en sus dos formas.
 *
 * **En escritorio**, la fila de píldoras de siempre. **En mobile, un
 * desplegable**: un solo botón con el tema activo que al tocarlo muestra los
 * cinco (opción A de las correcciones de la organización del 03/10, §4.1). La
 * fila con scroll horizontal que había antes dejaba entrar una sola categoría
 * entera y la siguiente cortada a la mitad, y en iPhone se leía como un error.
 * El desplegable ocupa una línea y no depende del ancho: si se suma un sexto
 * tema, entra igual.
 *
 * Las dos formas se renderizan siempre y se alternan con `md:hidden` /
 * `max-md:hidden` en un envoltorio, no con `matchMedia`: así el HTML del
 * servidor ya sale bien en cualquier ancho y no hay salto al hidratar.
 *
 * Sirve para los dos menús de la biblioteca: el de `/contenidos`, que es de
 * estado (`onChoose`, no navega), y el de la ficha de un contenido
 * (`LibraryNav`), que navega (`href` en cada opción).
 */
export function CategoryMenu({
  items,
  active,
  onChoose,
}: {
  items: CategoryMenuItem[];
  active: string;
  onChoose?: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const activeLabel = items.find((item) => item.value === active)?.label ?? "";

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function renderOption(item: CategoryMenuItem, className: string) {
    const isActive = item.value === active;
    const choose = () => {
      setOpen(false);
      onChoose?.(item.value);
    };
    return item.href ? (
      <Link
        href={item.href}
        onClick={choose}
        aria-current={isActive ? "page" : undefined}
        className={className}
      >
        {item.label}
      </Link>
    ) : (
      <button
        type="button"
        onClick={choose}
        aria-pressed={isActive}
        className={className}
      >
        {item.label}
      </button>
    );
  }

  return (
    <div ref={rootRef}>
      <ul className="flex flex-wrap justify-center gap-2 max-md:hidden">
        {items.map((item) => (
          <li key={item.value}>
            {renderOption(
              item,
              `${CHIP} ${
                item.value === active
                  ? ACTIVE
                  : `hover:scale-[1.04] ${CTA_TONES.dark}`
              }`
            )}
          </li>
        ))}
      </ul>

      <div className="relative md:hidden">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={listId}
          className={`flex w-full items-center justify-between gap-3 rounded-full border-[1.5px] px-5 py-2.5 text-label-sm uppercase ${ACTIVE}`}
        >
          <span className="truncate">{activeLabel}</span>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <ul
            id={listId}
            className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-2xl border border-[#b3964b]/40 bg-[#fff6eb] py-1.5 shadow-[0_18px_40px_-18px_rgba(5,18,90,0.6)]"
          >
            {items.map((item) => (
              <li key={item.value}>
                {renderOption(
                  item,
                  `block w-full px-5 py-3 text-left text-label-sm uppercase transition-colors ${
                    item.value === active
                      ? "bg-[#05125a]/8 font-semibold text-[#05125a]"
                      : "text-[#05125a]/80 hover:bg-[#05125a]/5"
                  }`
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
