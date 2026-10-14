/**
 * El avatar de la cuenta es siempre la inicial del nombre, sin foto (Sofía,
 * 14/10): "si es Sofía, una S". Por eso ya no hay subida de imagen.
 */
export function Avatar({ label }: { label: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-primary-container/45 bg-white/[0.06]"
    >
      <span className="font-display text-3xl text-primary-container">{label}</span>
    </div>
  );
}
