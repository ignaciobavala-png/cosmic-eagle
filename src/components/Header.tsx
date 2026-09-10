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
          abajo. Por eso cada `main` compensa con `pt-[var(--navbar-h)]`. */}
      <header className="fixed top-0 w-full z-50 bg-[linear-gradient(to_right,#05125a_0%,#0079b3_100%)]">
        {/* La barra horizontal se muestra desde `md`. Ojo, el comentario que
            estuvo aca decia "arranca en lg" y el codigo nunca lo cumplio: entre
            768 y ~1150 el logo + los 3 links + el CTA no entran y el CTA se sale
            de la pantalla (medido: con un viewport de 768 termina en el pixel
            1081). Es previo y sigue igual — subir el breakpoint cambiaria a
            drawer un rango entero de pantallas y eso no se decidio. */}
        {/* La barra va a TODO el ancho: el `max-w-narrative` (1200px
            centrados) era un desvio nuestro — el mockup de Julia no tiene tope,
            solo `padding: 0 60px`. En una pantalla de 1920 dejaba 360px muertos
            a cada lado y la barra se leia vacia con todo apretado en el medio,
            que es lo que Sofia describio como "comprimido" (reunion del 04/09).

            Es una grilla de tres columnas y no un `justify-between`: con
            `1fr auto 1fr` las secciones quedan centradas contra el VIEWPORT y
            no contra el hueco que dejan el logo y el CTA, que miden distinto
            (y el derecho cambia de ancho segun haya sesion o no).

            Los tracks laterales van `minmax(max-content,1fr)` y no `1fr` pelado:
            cuando el contenido no entra (ver abajo), un `1fr` se comprime por
            debajo del ancho del logo y lo aplasta a cero. */}
        <nav className="grid grid-cols-[auto_1fr] md:grid-cols-[minmax(max-content,1fr)_auto_minmax(max-content,1fr)] items-center gap-4 px-margin-mobile md:px-margin-desktop h-14 md:h-16 w-full">
          <Link href="/" className="shrink-0 justify-self-start">
            <Image
              src={IMAGES.logo}
              alt="Cosmic Eagle"
              width={914}
              height={267}
              priority
              sizes="(min-width: 1024px) 280px, 220px"
              className="h-9 md:h-11 w-auto object-contain"
            />
          </Link>

          <ul className="hidden md:flex items-center justify-center gap-2">
            {NAV_LINKS.filter((l) => l.href !== "/cuenta").map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <li key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    className="flex items-center gap-1.5 whitespace-nowrap px-[1.75rem] py-2 font-display text-[13px] uppercase tracking-[0.115em]"
                  >
                    {/* El dorado va en DEGRADE (#f9d78f -> #b3964b, pedido de
                        Julia del 08/09), y un degrade solo se puede pintar
                        sobre el fondo: de ahi el `bg-clip-text` con el texto
                        transparente.

                        Por eso el degrade va en un `span` propio y NO en el
                        Link: con el texto transparente heredado, el chevron
                        —que es un SVG con `currentColor`— se volveria
                        invisible. El icono se pinta aparte.

                        La seccion activa se distingue con el dorado claro
                        entero (`primary-container`, que es el extremo brillante
                        del mismo degrade) en vez de con otro color: asi el
                        estado activo no se sale de lo que pidio. */}
                    <span
                      className={`transition-[filter] duration-200 group-hover:brightness-110 ${
                        isActive
                          ? "text-primary-container"
                          : "bg-[linear-gradient(90deg,#f9d78f,#b3964b)] bg-clip-text text-transparent"
                      }`}
                    >
                      {link.label}
                    </span>
                    {link.children && (
                      <ChevronDown
                        size={13}
                        aria-hidden="true"
                        className="text-primary-fixed-dim transition-transform duration-200 group-hover:rotate-180"
                      />
                    )}
                  </Link>

                  {/* El wrapper arranca pegado al link (`top-full`) y la
                      separacion visual la da su `pt-2`: con un `top` desplazado
                      queda un hueco muerto entre las dos cajas y el menu se
                      cierra al bajar el mouse en diagonal. Por eso el
                      desplazamiento de entrada lo hace el panel de adentro y no
                      este wrapper: moverlo a el abriria ese hueco.

                      Va CENTRADO bajo el link (`left:50%` en el CSS de Julia)
                      y no pegado al borde izquierdo, que hacia que el panel
                      colgara de una esquina y se leyera como una caja suelta.

                      **El centrado va con margen negativo y NO con
                      `-translate-x-1/2`, y la entrada con `margin-top` y no con
                      `translate-y`**: un `transform` en cualquier ancestro
                      convierte a ese ancestro en el bloque contenedor de un
                      `background-attachment: fixed`, y el velo del panel
                      depende justamente de que ese fondo se resuelva contra la
                      PANTALLA para empalmar con el degrade del navbar. Con el
                      transform puesto, el degrade arrancaba en el borde
                      izquierdo del panel y el menu quedaba varios tonos mas
                      oscuro que la barra de la que cuelga (medido el 10/09:
                      el navbar en (2,69,134) contra el panel en (5,30,101)).
                      Por eso el ancho `w-[21rem]` y el `-ml-[10.5rem]` van
                      juntos: si cambia uno, cambia el otro. */}
                  {link.children && (
                    <div className="invisible absolute left-1/2 top-full z-50 -ml-[10.5rem] pt-2 opacity-0 transition-opacity duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                      {/* El panel dejo de ser una caja (pedido de la clienta,
                          10/09: "seguimos viendo un cuadrado"). Ya no lleva
                          borde, ni radio, ni sombra, ni fondo propio: lo que lo
                          sostiene es el filete dorado del que cuelga y un velo
                          que se desvanece por los cuatro lados
                          (`nav-dropdown-veil`, ver globals.css, que explica por
                          que el fondo continua el degrade del navbar y por que
                          la mascara es imprescindible).

                          De ahi el ancho de 21rem para dos palabras: el ancho
                          de mas NO sobra, es el margen que se usa para
                          disolver los cantos. Angostarlo devuelve la arista.

                          Lo que se conserva del mockup de Julia: el azul de la
                          paleta, el filete dorado coronando el panel con el
                          rombo de 4 puntas centrado bajo el link, el titulo en
                          Domine dorado y los items separados por una linea
                          tenue — que ahora se apaga en las puntas en vez de
                          cruzar de lado a lado.

                          Desde la reunion del 04/09 el panel lleva SOLO
                          titulos: la descripcion de cada item salio a pedido de
                          la clienta.

                          El panel entra ademas subiendo 6px. El desplazamiento
                          va aca adentro y no en el wrapper, que tiene que
                          quedarse pegado al link (ver arriba). */}
                      <ul className="relative isolate mt-1.5 w-[21rem] px-[18px] pb-[54px] pt-[22px] transition-[margin] duration-200 group-hover:mt-0 group-focus-within:mt-0">
                        {/* El velo va como elemento propio y no como fondo del
                            `ul` porque necesita salirse de su caja (`-bottom-10`)
                            y quedar DETRAS del texto. El `isolate` del padre lo
                            encierra: sin el, un z negativo se escapa del panel y
                            lo tapa el fondo de la pagina. */}
                        <span aria-hidden="true" className="nav-dropdown-veil" />
                        {/* El filete y el rombo son decoracion pura: van en
                            elementos vacios para que ningun lector de pantalla
                            los anuncie, igual que los filetes de
                            `SectionHeading`. */}
                        {/* El filete cruza todo el ancho pero solo esta opaco
                            en el tercio central: es la linea de la que cuelga el
                            menu, no el borde de una caja. */}
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,#f9d78f_38%,#f9d78f_62%,transparent)]"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute left-1/2 top-0 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-primary-container shadow-[0_0_10px_rgba(249,215,143,0.55)]"
                        />
                        {link.children.map((child, i, todos) => (
                          <li key={child.href} className="relative">
                            {/* La linea entre opciones se apaga en las puntas:
                                una que cruzara entera volveria a dibujar filas
                                dentro de un rectangulo. El hover ya no pinta un
                                fondo (eso era, otra vez, una cajita): cambia el
                                dorado por la crema. */}
                            <Link
                              href={child.href}
                              className="nav-dropdown-item block px-1 py-[13px] text-center font-display text-base font-bold tracking-[0.03em] text-primary-container transition-colors hover:text-primary"
                            >
                              {child.label}
                            </Link>
                            {i < todos.length - 1 && (
                              <span
                                aria-hidden="true"
                                className="absolute inset-x-[26%] bottom-0 h-px bg-[linear-gradient(to_right,transparent,rgba(249,215,143,0.35),transparent)]"
                              />
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex shrink-0 items-center justify-end gap-4 justify-self-end">
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
