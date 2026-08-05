"use client";

import { useUIStore } from "@/lib/store";
import { IMAGES, NAV_LINKS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { CtaLink } from "@/components/ui/CtaLink";
import {
  Menu,
  X,
  Info,
  Sparkles,
  BookOpen,
  User,
  CircleUser,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const iconMap = {
  Info,
  Sparkles,
  BookOpen,
  User,
};

type AccountProfile = {
  fullName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
} | null;

export function Header() {
  const { drawerOpen, toggleDrawer, setDrawerOpen } = useUIStore();
  const pathname = usePathname();
  const [profile, setProfile] = useState<AccountProfile>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setProfile(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, is_admin")
        .eq("id", user.id)
        .single();

      if (!active) return;
      setProfile({
        fullName: data?.full_name ?? null,
        avatarUrl: data?.avatar_url ?? null,
        isAdmin: data?.is_admin ?? false,
      });
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#05060a]/70 backdrop-blur-xl border-b border-primary-fixed-dim/12">
        {/* La barra horizontal arranca en lg, no en md: entre 768 y 1024 el
            logo + los 3 links + "Unirme al circulo" no entran y el CTA termina
            pisando el logo. Hasta 1024 manda el drawer, que entra siempre. */}
        <nav className="flex items-center justify-between gap-4 px-margin-mobile lg:px-margin-desktop h-16 w-full max-w-narrative mx-auto">
          <Link href="/" className="shrink-0">
            <Image
              src={IMAGES.logo}
              alt="Cosmic Eagle"
              width={914}
              height={267}
              priority
              sizes="(min-width: 1024px) 280px, 220px"
              className="h-9 lg:h-11 w-auto object-contain"
            />
          </Link>

          <ul className="hidden lg:flex items-center gap-2">
            {NAV_LINKS.filter((l) => l.href !== "/cuenta").map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <li key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 text-label-sm uppercase transition-colors duration-200 ${
                      isActive
                        ? "text-primary-fixed-dim"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {link.label}
                    {link.children && (
                      <ChevronDown
                        size={13}
                        aria-hidden="true"
                        className="transition-transform duration-200 group-hover:rotate-180"
                      />
                    )}
                  </Link>

                  {/* El wrapper arranca pegado al link (`top-full`) y la
                      separacion visual la da su `pt-2`: con un `top` desplazado
                      queda un hueco muerto entre las dos cajas y el menu se
                      cierra al bajar el mouse en diagonal. */}
                  {link.children && (
                    <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-opacity duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                      <ul className="min-w-56 rounded-2xl border border-primary-fixed-dim/20 bg-[#05060a]/95 p-2 shadow-2xl backdrop-blur-xl">
                        {link.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className="block rounded-lg px-3 py-2 transition-colors hover:bg-primary-container/10"
                            >
                              <span className="block text-label-sm uppercase text-on-surface">
                                {child.label}
                              </span>
                              <span className="mt-0.5 block text-xs text-on-surface-variant">
                                {child.description}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex shrink-0 items-center gap-4">
            {profile ? (
              <Link
                href={profile.isAdmin ? "/admin" : "/cuenta"}
                className="hidden lg:inline-flex items-center gap-2 text-on-surface-variant hover:text-primary-fixed-dim transition-colors duration-300"
              >
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <CircleUser size={20} />
                )}
                <span className="text-label-sm uppercase">
                  {profile.fullName?.split(" ")[0] || "Mi Cuenta"}
                </span>
              </Link>
            ) : (
              // El `hidden` va en el wrapper, no en el CtaLink: su base trae
              // `inline-flex` y le gana a `hidden` por orden de la hoja.
              <div className="hidden lg:flex">
                <CtaLink
                  href="/cuenta?modo=registro"
                  className="whitespace-nowrap px-5 py-2"
                >
                  Unirme al círculo
                  <ArrowRight size={14} />
                </CtaLink>
              </div>
            )}

            <button
              onClick={toggleDrawer}
              className="lg:hidden active:scale-95 transition-transform"
              aria-label="Abrir menú"
            >
              <Menu className="text-primary-fixed-dim" size={24} />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-void-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[60] w-80 max-w-[85vw] bg-surface-container-low/95 backdrop-blur-2xl border-r border-parchment/10 shadow-2xl flex flex-col py-6 lg:hidden"
            >
              <div className="px-6 py-4 border-b border-parchment/5 flex justify-between items-center">
                <Link href="/" onClick={() => setDrawerOpen(false)}>
                  <Image
                    src={IMAGES.logo}
                    alt="Cosmic Eagle"
                    width={914}
                    height={267}
                    sizes="200px"
                    className="h-8 w-auto object-contain"
                  />
                </Link>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-on-surface-variant"
                  aria-label="Cerrar menú"
                >
                  <X size={24} />
                </button>
              </div>
              <ul className="flex flex-col py-6">
                {NAV_LINKS.map((link) => {
                  const Icon = iconMap[link.icon];
                  const isActive = pathname === link.href;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setDrawerOpen(false)}
                        className={`mx-2 flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-primary-container text-on-primary"
                            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30"
                        }`}
                      >
                        <Icon size={20} />
                        <span className="tracking-[0.1em] font-semibold text-sm uppercase">
                          {link.label}
                        </span>
                      </Link>

                      {/* En el drawer no hay hover: los hijos se muestran
                          siempre, indentados bajo el padre. */}
                      {link.children && (
                        <ul className="mb-1 ml-[3.25rem] mr-2 flex flex-col border-l border-primary-fixed-dim/20 pl-3">
                          {link.children.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={() => setDrawerOpen(false)}
                                className="block rounded-lg px-3 py-2 text-sm tracking-[0.05em] text-on-surface-variant uppercase transition-colors hover:bg-surface-variant/30 hover:text-on-surface"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>

              {!profile && (
                <div
                  className="mt-auto px-6"
                  onClick={() => setDrawerOpen(false)}
                >
                  <CtaLink
                    href="/cuenta?modo=registro"
                    className="w-full"
                  >
                    Unirme al círculo
                    <ArrowRight size={14} />
                  </CtaLink>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
