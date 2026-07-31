import { CtaLink } from "./CtaLink";

/** Estrella de 4 puntas: el simbolo que el sistema usa como divider y remate. */
export function FourPointStar({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`fill-primary-fixed-dim ${className}`}
    >
      <path d="M12 0c.6 5.9 5.5 10.8 11.4 11.4v1.2C17.5 13.2 12.6 18.1 12 24h-1.2C10.2 18.1 5.3 13.2-.6 12.6v-1.2C5.3 10.8 10.2 5.9 10.8 0z" />
    </svg>
  );
}

/**
 * P5 — Cierre centrado. Simbolo, titulo dorado, parrafo angosto y un CTA
 * solido. Es el remate de /nosotros y el patron para cerrar cualquier pagina
 * narrativa empujando al paso siguiente del recorrido.
 */
export function ClosingSection({
  title,
  children,
  action,
  id,
}: {
  title: string;
  children: React.ReactNode;
  action?: { label: string; href: string };
  id?: string;
}) {
  return (
    <section
      id={id}
      className="mx-auto w-full max-w-narrative px-margin-mobile md:px-margin-desktop py-20 md:py-section text-center"
    >
      <FourPointStar className="mx-auto mb-6 h-6 w-6" />
      <h2 className="font-display text-headline-md md:text-headline-lg text-primary-fixed-dim">
        {title}
      </h2>
      <div className="mx-auto mt-6 max-w-2xl space-y-4 text-body-md text-on-surface-variant [&_strong]:text-primary [&_strong]:font-semibold">
        {children}
      </div>
      {action && (
        <CtaLink href={action.href} className="mt-10">
          {action.label}
        </CtaLink>
      )}
    </section>
  );
}
