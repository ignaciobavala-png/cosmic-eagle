import Image from "next/image";
import { CtaLink } from "./CtaLink";

/**
 * P6 — Banda de llamado. Franja ancha y baja, imagen anclada al pie, titulo
 * serif centrado y un unico CTA solido encima. Cierra una pagina de catalogo
 * empujando al paso siguiente, sin el simbolo ni el parrafo de P5
 * (ClosingSection), que es el cierre de las paginas narrativas.
 *
 * La imagen se funde arriba y a los costados en vez de recortar: la banda no
 * es un bloque pegado sino una zona mas luminosa del mismo cielo de la pagina.
 */
export function CallBand({
  image,
  imageAlt = "",
  title,
  action,
  id,
}: {
  image: string;
  imageAlt?: string;
  title: string;
  action: { label: string; href: string };
  id?: string;
}) {
  return (
    <section id={id} className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.5)_28%,#000_60%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.5)_28%,#000_60%)]">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="100vw"
          className="object-cover object-bottom"
        />
      </div>

      <div className="mx-auto flex max-w-narrative flex-col items-center px-margin-mobile md:px-margin-desktop pt-20 pb-40 md:pt-24 md:pb-56 text-center">
        <h2 className="font-display text-headline-md md:text-headline-lg text-primary text-shadow-glow text-balance">
          {title}
        </h2>
        <CtaLink href={action.href} className="mt-8">
          {action.label}
        </CtaLink>
      </div>
    </section>
  );
}
