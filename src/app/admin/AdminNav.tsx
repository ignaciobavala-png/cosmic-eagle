"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Check,
  ChevronDown,
  CircleUser,
  ExternalLink,
  LogOut,
  Menu,
} from "lucide-react";
import { logout } from "@/app/cuenta/actions";

/**
 * Las secciones, agrupadas por TAREA y no por orden de construccion, que es
 * como habian quedado: trece renglones planos en los que habia que leer todo
 * para encontrar uno. Los grupos van de lo que se toca todos los dias a lo que
 * se toca casi nunca.
 *
 * Dos renombres que salen de esto:
 *
 * - "Acceso a contenidos" -> **"Niveles de acceso"**. Se confundia con
 *   "Contenidos", que esta al lado y es otra cosa: aca no se carga contenido,
 *   se habilita gente.
 * - "Privacidad y Terminos" -> **"Legales"**. Era la etiqueta mas larga de la
 *   lista y la que menos se usa.
 *
 * Las RUTAS no cambian: son solo etiquetas.
 */
type NavLink = { href: string; label: string };

const GROUPS: { title: string; links: NavLink[] }[] = [
  {
    title: "Inscripciones",
    links: [
      { href: "/admin/solicitudes", label: "Solicitudes" },
      { href: "/admin/pagos", label: "Pagos" },
      { href: "/admin/crm", label: "CRM" },
    ],
  },
  {
    title: "Experiencias",
    links: [
      { href: "/admin/sesiones", label: "Sesiones" },
      { href: "/admin/viajes", label: "Viajes" },
    ],
  },
  {
    title: "El sitio",
    links: [
      { href: "/admin/multimedia", label: "Multimedia" },
      { href: "/admin/contenidos", label: "Contenidos" },
      { href: "/admin/testimonios", label: "Testimonios" },
      { href: "/admin/faqs", label: "Preguntas frecuentes" },
      { href: "/admin/legales", label: "Legales" },
    ],
  },
  {
    title: "Personas",
    links: [
      { href: "/admin/acceso", label: "Niveles de acceso" },
      { href: "/admin/suscriptores", label: "Suscriptores" },
    ],
  },
];

/** El Dashboard no es un grupo: es la portada, y va suelto arriba de todo. */
const HOME: NavLink = { href: "/admin", label: "Dashboard" };

const LINKS = [HOME, ...GROUPS.flatMap((group) => group.links)];

/**
 * Barra del panel. Las secciones van en **un desplegable y no en una fila**: con
 * ocho no entran al lado del logo ni en desktop, y abajo de `xl` caian a una
 * segunda fila con scroll horizontal, que esconde secciones sin avisar.
 * El desplegable ademas deja lugar para las que vengan.
 *
 * `unread` lo cuenta el layout (Server Component) y baja como prop: esta barra
 * es cliente por el `usePathname` y no puede consultar Supabase. El contador se
 * refresca cuando revalida el layout — por eso los actions de notificaciones
 * llaman `revalidatePath("/admin", "layout")` y no solo la pagina.
 */
function MenuLink({
  link,
  active,
}: {
  link: NavLink;
  active: boolean;
}) {
  return (
    <Link
      href={link.href}
      role="menuitem"
      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-primary-container/10 text-primary-fixed-dim"
          : "text-on-surface-variant hover:bg-primary-container/5 hover:text-on-surface"
      }`}
    >
      {link.label}
      {active && <Check size={14} className="shrink-0" />}
    </Link>
  );
}

export function AdminNav({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  // Se guarda EN QUE ruta se abrio el menu, no un booleano: asi navegar lo
  // cierra solo (cambia `pathname` y deja de coincidir) sin un efecto que
  // dispare un render extra en cada navegacion.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = openedAt === pathname;

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  const current = LINKS.find((link) => isActive(link.href));

  // Click afuera y Escape. El menu tapa contenido, asi que tiene que poder
  // cerrarse sin apuntarle al boton.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpenedAt(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenedAt(null);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="border-b border-parchment/10 bg-surface/80 backdrop-blur-xl">
      <nav className="flex items-center justify-between gap-3 px-5 md:px-8 h-16 max-w-6xl mx-auto">
        <div className="flex min-w-0 items-center gap-3 md:gap-5">
          <Link
            href="/admin"
            className="font-display text-base md:text-lg text-primary-fixed-dim whitespace-nowrap"
          >
            <span className="md:hidden">CE · Admin</span>
            <span className="hidden md:inline">Cosmic Eagle · Admin</span>
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpenedAt(open ? null : pathname)}
              aria-expanded={open}
              aria-haspopup="menu"
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium tracking-[0.02em] transition-colors ${
                open
                  ? "border-primary-fixed-dim/50 text-primary-fixed-dim bg-primary-container/10"
                  : "border-outline-variant/60 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Menu size={16} className="shrink-0" />
              {/* En mobile solo el icono: el nombre de la seccion se lee igual
                  en el titulo de la pagina, abajo. */}
              <span className="hidden sm:inline max-w-[10rem] truncate">
                {current?.label ?? "Secciones"}
              </span>
              <ChevronDown
                size={15}
                className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              /* Dos columnas y no una lista: con trece secciones apiladas el
                 menu medía media pantalla y habia que leerlo entero. En dos
                 columnas los cuatro grupos entran de un vistazo.
                 En telefono el panel NO cuelga del boton: se ancla al viewport
                 (`fixed inset-x-4`) y cae a una columna. Colgado del boton se
                 salia por la derecha —medido: el borde caia en 469px con una
                 pantalla de 390—, porque el disparador ya arranca corrido por
                 el logo y el ancho del menu crecio. */
              <div
                role="menu"
                aria-label="Secciones del panel"
                className="fixed inset-x-4 top-[4.5rem] z-50 rounded-xl border border-outline-variant/60 bg-surface-container-low p-2 shadow-xl shadow-black/40 sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 sm:w-[min(32rem,calc(100vw-2.5rem))]"
              >
                <MenuLink link={HOME} active={isActive(HOME.href)} />

                <div className="mt-1 grid gap-x-2 gap-y-3 sm:grid-cols-2">
                  {GROUPS.map((group) => (
                    <div key={group.title} role="group" aria-label={group.title}>
                      {/* El titulo del grupo no es un item del menu: no se
                          navega ni recibe foco. */}
                      <p
                        aria-hidden="true"
                        className="px-3 pb-1 pt-2 font-display text-[11px] uppercase tracking-[0.12em] text-on-surface-variant/60"
                      >
                        {group.title}
                      </p>
                      {group.links.map((link) => (
                        <MenuLink
                          key={link.href}
                          link={link}
                          active={isActive(link.href)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
    </header>
  );
}
