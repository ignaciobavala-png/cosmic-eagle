"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CircleUser, ExternalLink, LogOut } from "lucide-react";
import { logout } from "@/app/cuenta/actions";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/retiros", label: "Retiros" },
  { href: "/admin/ceremonias", label: "Ceremonias" },
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/multimedia", label: "Multimedia" },
  { href: "/admin/crm", label: "CRM" },
  { href: "/admin/suscriptores", label: "Suscriptores" },
];

/**
 * `unread` lo cuenta el layout (Server Component) y baja como prop: esta barra
 * es cliente por el `usePathname` y no puede consultar Supabase. El contador se
 * refresca cuando revalida el layout — por eso los actions de notificaciones
 * llaman `revalidatePath("/admin", "layout")` y no solo la pagina.
 */
export function AdminNav({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  return (
    <header className="border-b border-parchment/10 bg-surface/80 backdrop-blur-xl">
      <nav className="flex items-center justify-between gap-3 px-5 md:px-8 h-16 max-w-6xl mx-auto">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/admin"
            className="font-display text-base md:text-lg text-primary-fixed-dim whitespace-nowrap"
          >
            <span className="md:hidden">CE · Admin</span>
            <span className="hidden md:inline">Cosmic Eagle · Admin</span>
          </Link>
          {/* Inline recien en xl: con siete secciones la fila ya no entra al
              lado del logo y las acciones en pantallas chicas de notebook, y
              los links se montaban unos sobre otros. Igual lleva overflow por
              si aparece una seccion mas. */}
          <ul className="hidden min-w-0 xl:flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {LINKS.map((link) => (
              <li key={link.href} className="shrink-0">
                <Link
                  href={link.href}
                  className={`block whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium tracking-[0.02em] transition-colors ${
                    isActive(link.href)
                      ? "text-primary-fixed-dim bg-primary-container/10"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 items-center gap-3 md:gap-4">
          <Link
            href="/admin/notificaciones"
            aria-label={
              unread > 0 ? `Notificaciones (${unread} sin leer)` : "Notificaciones"
            }
            className={`relative transition-colors ${
              isActive("/admin/notificaciones")
                ? "text-primary-fixed-dim"
                : "text-on-surface-variant hover:text-primary-fixed-dim"
            }`}
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-error text-[10px] font-bold leading-4 text-center text-on-surface">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <Link
            href="/cuenta?vista=viajero"
            aria-label="Mi perfil"
            className="text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors"
          >
            <CircleUser size={20} className="md:hidden" />
            <span className="hidden md:inline">Mi perfil</span>
          </Link>
          <Link
            href="/"
            aria-label="Ver sitio"
            className="text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors"
          >
            <ExternalLink size={18} className="md:hidden" />
            <span className="hidden md:inline">Ver sitio</span>
          </Link>
          <form action={logout} className="flex">
            <button
              type="submit"
              aria-label="Cerrar sesión"
              className="text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors md:underline"
            >
              <LogOut size={18} className="md:hidden" />
              <span className="hidden md:inline">Cerrar sesión</span>
            </button>
          </form>
        </div>
      </nav>

      {/* Debajo de xl los links no caben en la barra: van en una fila propia
          con scroll horizontal. Sin esto el admin no tenia forma de navegar
          entre secciones desde el telefono. */}
      <ul className="mx-auto flex max-w-6xl xl:hidden items-center gap-1 overflow-x-auto px-5 pb-2 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LINKS.map((link) => (
          <li key={link.href} className="shrink-0">
            <Link
              href={link.href}
              className={`block whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium tracking-[0.02em] transition-colors ${
                isActive(link.href)
                  ? "text-primary-fixed-dim bg-primary-container/10"
                  : "text-on-surface-variant"
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </header>
  );
}
