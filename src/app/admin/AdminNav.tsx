"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/cuenta/actions";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/viajes", label: "Viajes" },
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/suscriptores", label: "Suscriptores" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-parchment/10 bg-surface/80 backdrop-blur-xl">
      <nav className="flex items-center justify-between px-5 md:px-8 h-16 max-w-6xl mx-auto">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-display text-lg text-primary-fixed-dim">
            Cosmic Eagle · Admin
          </Link>
          <ul className="hidden md:flex items-center gap-1">
            {LINKS.map((link) => {
              const isActive =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium tracking-[0.02em] transition-colors ${
                      isActive
                        ? "text-primary-fixed-dim bg-primary-container/10"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/cuenta?vista=viajero"
            className="text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors"
          >
            Mi perfil
          </Link>
          <Link
            href="/"
            className="text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors"
          >
            Ver sitio
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors underline"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
