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
      {/* El fondo sale del mockup aprobado de Julia (`homepage_correccion.html`,
          entrega del 02/09): degrade horizontal recto de #05125a a #0079b3, sin
          mesetas. Antes se muestreaba del PNG `navbar.png` y quedaba plano hasta
          el 31% y rematando en #026fab; el codigo de ella es la referencia y su
          `--azul-claro` es #0079b3. Se hace en CSS por lo mismo que la banda
          dorada y "La humanidad" (docs/HOME_REDISENO.md §6.1): pesa cero, no se
          pixela y acompana cualquier ancho de viewport. Es la misma familia de
          degrade que ya usa el footer, pero al reves de arriba a abajo.

          Ojo: el navbar paso a ser OPACO. Antes era vidrio y el hero le pasaba
          por debajo; en el mockup es una banda solida y el contenido arranca
          abajo. Por eso cada `main` compensa con `pt-18 md:pt-24`. */}
      <header className="fixed top-0 w-full z-50 bg-[linear-gradient(to_right,#05125a_0%,#0079b3_100%)]">
        {/* La barra horizontal arranca en lg, no en md: entre 768 y 1024 el
            logo + los 3 links + "Unirme al circulo" no entran y el CTA termina
            pisando el logo. Hasta 1024 manda el drawer, que entra siempre. */}
        <nav className="flex items-center justify-between gap-4 px-margin-mobile md:px-margin-desktop h-18 md:h-24 w-full max-w-narrative mx-auto">
          <Link href="/" className="shrink-0">
            <Image
              src={IMAGES.logo}
              alt="Cosmic Eagle"
              width={914}
              height={267}
              priority
              sizes="(min-width: 1024px) 280px, 220px"
              className="h-10 md:h-16 w-auto object-contain"
            />
          </Link>

          <ul className="hidden md:flex items-center gap-2">
            {NAV_LINKS.filter((l) => l.href !== "/cuenta").map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <li key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    className={`flex items-center gap-1.5 whitespace-nowrap px-[1.75rem] py-2 font-display text-[13px] uppercase tracking-[0.115em] transition-colors duration-200 ${
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
                      cierra al bajar el mouse en diagonal. Por eso el
                      desplazamiento de entrada lo hace el panel de adentro y no
                      este wrapper: moverlo a el abriria ese hueco.

                      Va CENTRADO bajo el link (`left-1/2 -translate-x-1/2`),
                      que es lo que dice el CSS de Julia (`left:50%`) y no lo
                      que teniamos: pegado al borde izquierdo, el panel colgaba
                      de una esquina y se leia como una caja suelta. */}
                  {link.children && (
                    <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 opacity-0 transition-opacity duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                      {/* La caja sale del mockup (`.dropdown-experiences`) y
                          conserva su ADN: azul de la paleta, borde dorado,
                          titulo en Domine dorado y descripcion en Montserrat al
                          70%. Lo que cambia es lo que la hacia leerse "medio
                          cuadrada" (Sofia, 03/09), sin salirse de la paleta:

                          - el fondo deja de ser un plano: degrade de la misma
                            familia que el navbar y el footer (el celeste
                            #0079b3 apenas insinuado arriba sobre el azul
                            oscuro), que es como esta pintado el resto del sitio;
                          - radio de 12 a 18px, y mas aire adentro;
                          - un filete dorado corona el panel y lo ata al navbar,
                            con el rombo de 4 puntas del sistema centrado
                            encima, bajo el link;
                          - los dos items se separan con una linea dorada tenue
                            en vez de quedar apilados a la misma altura;
                          - cada item tiene su flecha, que entra y avanza en
                            hover: sin ella nada decia que eran links.

                          El panel entra ademas subiendo 6px. El desplazamiento
                          va aca adentro y no en el wrapper, que tiene que
                          quedarse pegado al link (ver arriba). */}
                      <ul className="relative w-[22rem] rounded-[18px] border border-primary-container/25 bg-[linear-gradient(160deg,rgba(0,121,179,0.32)_0%,rgba(5,18,90,0.97)_55%,rgba(2,12,65,0.98)_100%)] p-6 pt-7 shadow-[0_18px_50px_rgba(2,12,65,0.55)] backdrop-blur-xl transition-transform duration-200 translate-y-1.5 group-hover:translate-y-0 group-focus-within:translate-y-0">
                        {/* El filete y el rombo son decoracion pura: van en
                            elementos vacios para que ningun lector de pantalla
                            los anuncie, igual que los filetes de
                            `SectionHeading`. */}
                        {/* El filete no llega a las esquinas (`inset-x-8`):
                            con el radio de 18px, una linea de borde a borde se
                            escapa de la curva y deja dos puntas sueltas. */}
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-8 top-0 h-px bg-[linear-gradient(to_right,transparent,#f9d78f,transparent)]"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute left-1/2 top-0 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-primary-container shadow-[0_0_10px_rgba(249,215,143,0.55)]"
                        />
                        {link.children.map((child) => (
                          <li
                            key={child.href}
                            className="[&:not(:last-child)]:mb-1 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-primary-container/12 [&:not(:last-child)]:pb-1"
                          >
                            <Link
                              href={child.href}
                              className="group/item flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-primary-container/[0.08]"
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block font-display text-base font-bold tracking-[0.03em] text-primary-container">
                                  {child.label}
                                </span>
                                <span className="mt-1.5 block text-[13px] font-light leading-relaxed text-primary-container/70">
                                  {child.description}
                                </span>
                              </span>
                              <ArrowRight
                                size={16}
                                aria-hidden="true"
                                className="mt-1 shrink-0 text-primary-container/40 transition-[transform,color] duration-200 group-hover/item:translate-x-1 group-hover/item:text-primary-container"
                              />
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
                className="hidden md:inline-flex items-center gap-2 text-on-surface-variant hover:text-primary-fixed-dim transition-colors duration-300"
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
                <span className="font-display text-label-sm uppercase">
                  {profile.fullName?.split(" ")[0] || "Mi Cuenta"}
                </span>
              </Link>
            ) : (
              // El `hidden` va en el wrapper, no en el CtaLink: su base trae
              // `inline-flex` y le gana a `hidden` por orden de la hoja.
              <div className="hidden md:flex">
                <CtaLink
                  href="/cuenta?modo=registro"
                  variant="pill"
                  className="whitespace-nowrap px-6 py-3"
                >
                  Unirme al círculo
                  <ArrowRight size={14} />
                </CtaLink>
              </div>
            )}

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
              className="fixed inset-y-0 left-0 z-[60] w-80 max-w-[85vw] bg-surface-container-low/95 backdrop-blur-2xl border-r border-parchment/10 shadow-2xl flex flex-col py-6 md:hidden"
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
                        <span className="font-display tracking-[0.1em] font-semibold text-sm uppercase">
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
                                className="block rounded-lg px-3 py-2 font-display text-sm tracking-[0.05em] text-on-surface-variant uppercase transition-colors hover:bg-surface-variant/30 hover:text-on-surface"
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
                    variant="pill"
                    className="w-full py-4"
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
