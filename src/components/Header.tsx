"use client";

import { useUIStore } from "@/lib/store";
import { IMAGES, NAV_LINKS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  Home,
  Info,
  Sparkles,
  BookOpen,
  User,
  CircleUser,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const iconMap = {
  Home,
  Info,
  Sparkles,
  BookOpen,
  User,
};

type AccountProfile = { fullName: string | null; avatarUrl: string | null } | null;

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
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (!active) return;
      setProfile({ fullName: data?.full_name ?? null, avatarUrl: data?.avatar_url ?? null });
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
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-parchment/10">
        <nav className="flex items-center justify-between px-5 md:px-16 h-16 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <Link href="/">
              <img
                src={IMAGES.logo}
                alt="Cosmic Eagle Logo"
                className="h-8 md:h-10 object-contain"
              />
            </Link>

            <ul className="hidden md:flex items-center gap-1">
              {NAV_LINKS.filter((l) => l.href !== "/cuenta").map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`px-3 py-2 rounded-lg text-sm font-medium tracking-[0.05em] transition-colors duration-200 ${
                        isActive
                          ? "text-primary-fixed-dim"
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
              href="/cuenta"
              className="hidden md:inline-flex items-center gap-2 text-on-surface-variant hover:text-primary-fixed-dim transition-colors duration-300"
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <CircleUser size={20} />
              )}
              <span className="text-sm font-medium tracking-[0.05em]">
                {profile ? profile.fullName?.split(" ")[0] || "Mi Cuenta" : "Mi Cuenta"}
              </span>
            </Link>

            <button
              onClick={toggleDrawer}
              className="md:hidden active:scale-95 transition-transform"
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
              className="fixed inset-0 z-[60] bg-void-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[60] w-80 bg-surface-container-low/95 backdrop-blur-2xl border-r border-parchment/10 shadow-2xl flex flex-col py-6 md:hidden"
            >
              <div className="px-6 py-4 border-b border-parchment/5 flex justify-between items-center">
                <h2 className="font-display text-2xl text-primary-fixed-dim">
                  Cosmic Journey
                </h2>
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
                            ? "bg-primary-container text-on-primary-container"
                            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30"
                        }`}
                      >
                        <Icon size={20} />
                        <span className="tracking-[0.1em] font-semibold text-sm uppercase">
                          {link.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
