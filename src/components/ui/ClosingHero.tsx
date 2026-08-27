import Image from "next/image";
import { CtaLink } from "./CtaLink";
import { Reveal } from "./Reveal";

/**
 * Cierre a pantalla completa: imagen atenuada sobre azul, titulo en mayusculas
 * y hasta dos botones.
 *
 * Es el `.nos-cierre` del rediseño, y reemplaza al remate centrado con estrella
 * (`ClosingSection`, P5) en las paginas que Julia rehizo. La imagen va al 40%
 * sobre el azul solido — no es una foto de portada sino una textura de fondo,
 * asi que el titulo se lee sin velo extra.
 */
export function ClosingHero({
  image,
  imageAlt = "",
  title,
  actions = [],
  id,
}: {
  image: string;
  imageAlt?: string;
  title: React.ReactNode;
  actions?: { label: string; href: string; variant?: "solid" | "ghost" }[];
  id?: string;
}) {
  return (
    <section
      id={id}
      className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-[#05125a] text-center"
    >
      <Image
        src={image}
        alt={imageAlt}
        fill
        sizes="100vw"
        className="object-cover opacity-40"
      />

      <Reveal className="relative z-10 px-margin-mobile md:px-margin-desktop">
        <h2 className="font-display text-display-mobile md:text-display-lg font-bold uppercase text-primary text-balance">
          {title}
        </h2>

        {actions.length > 0 && (
          <div className="mt-10 flex w-full max-w-xs flex-col items-stretch gap-4 sm:max-w-none sm:flex-row sm:justify-center sm:gap-8">
            {actions.map((action) => (
              <CtaLink
                key={action.href + action.label}
                href={action.href}
                variant={action.variant ?? "solid"}
                className={
                  action.variant === "ghost"
                    ? "rounded-full"
                    : "rounded-full shadow-[0_0_22px_rgba(249,215,143,0.6),0_0_43px_rgba(249,215,143,0.32)]"
                }
              >
                {action.label}
              </CtaLink>
            ))}
          </div>
        )}
      </Reveal>
    </section>
  );
}
