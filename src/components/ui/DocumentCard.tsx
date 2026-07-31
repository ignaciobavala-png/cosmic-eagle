/**
 * P2 — Card documento. Golden glass con eyebrow en mayusculas, titulo partido
 * en dos lineas (la segunda en oro) y cuerpo de parrafos largos.
 * Aparece en la home (Nuestra Esencia) y dos veces en /nosotros.
 */
export function DocumentCard({
  eyebrow,
  title,
  titleAccent,
  children,
  className = "",
}: {
  eyebrow?: string;
  title?: string;
  titleAccent?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`glass-card glint-edge rounded-2xl p-8 md:p-12 ${className}`}
    >
      {eyebrow && (
        <div className="mb-6 flex items-center gap-3">
          <span className="h-px w-8 bg-primary-fixed-dim/60" />
          <span className="text-label-sm uppercase text-primary-fixed-dim">
            {eyebrow}
          </span>
        </div>
      )}

      {(title || titleAccent) && (
        <h2 className="font-display text-headline-md md:text-headline-lg mb-6">
          {title && <span className="block text-on-surface">{title}</span>}
          {titleAccent && (
            <span className="block text-primary-fixed-dim">{titleAccent}</span>
          )}
        </h2>
      )}

      <div className="space-y-4 text-body-md text-on-surface-variant [&_strong]:text-primary-fixed-dim [&_strong]:font-semibold">
        {children}
      </div>
    </div>
  );
}
