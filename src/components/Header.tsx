"use client";

import { useUIStore } from "@/lib/store";
import { IMAGES, NAV_LINKS } from "@/lib/constants";
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

const iconMap = {
  Home,
  Info,
  Sparkles,
  BookOpen,
  User,
};

export function Header() {
  const { drawerOpen, toggleDrawer, setDrawerOpen } = useUIStore();
  const pathname = usePathname();

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
                          ? "text-primary"
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
              className="hidden md:inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors duration-300"
            >
              <CircleUser size={20} />
              <span className="text-sm font-medium tracking-[0.05em]">
                Mi Cuenta
              </span>
            </Link>

            <button
              onClick={toggleDrawer}
              className="md:hidden active:scale-95 transition-transform"
              aria-label="Abrir menú"
            >
              <Menu className="text-primary" size={24} />
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
                <h2 className="font-display text-2xl text-primary">
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
