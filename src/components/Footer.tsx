import Image from "next/image";
import Link from "next/link";
import { FOOTER_COLUMNS, IMAGES } from "@/lib/constants";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  return (
    <footer className="border-t border-primary-fixed-dim/12 bg-[#05060a]/60 pt-16 pb-8 px-margin-mobile md:px-margin-desktop">
      <div className="mx-auto grid max-w-narrative grid-cols-1 gap-12 md:grid-cols-4">
        <Link href="/" className="md:self-start">
          <Image
            src={IMAGES.logo}
            alt="Cosmic Eagle"
            width={914}
            height={267}
            sizes="280px"
            className="h-10 w-auto object-contain"
          />
        </Link>

        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.title} className="space-y-4">
            <h2 className="text-label-sm uppercase text-primary-fixed-dim">
              {column.title}
            </h2>
            <ul className="space-y-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  {link.href ? (
                    <Link
                      href={link.href}
                      className="text-body-md text-on-surface-variant transition-colors hover:text-primary-fixed-dim"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    // Sin ruta todavia: se muestra apagado en vez de linkear a "#"
                    <span
                      className="text-body-md text-on-surface-variant/40"
                      title="Próximamente"
                    >
                      {link.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="space-y-4">
          <h2 className="text-label-sm uppercase text-primary-fixed-dim">
            Sintoniza
          </h2>
          <p className="text-body-md text-on-surface-variant">
            Enterate de las novedades antes que nadie.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-narrative flex-col items-center justify-between gap-4 border-t border-primary-fixed-dim/8 pt-6 text-center md:flex-row md:text-left">
        <p className="text-label-sm uppercase text-on-surface-variant/70">
          &copy; 2026 Cosmic Eagle Journey
        </p>
        <p className="text-label-sm uppercase text-on-surface-variant/70">
          i.vavala
        </p>
      </div>
    </footer>
  );
}
