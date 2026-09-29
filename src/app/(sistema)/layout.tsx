import type { Metadata } from "next";
import { fontClassName } from "../fonts";
import "../globals.css";

/**
 * Root layout del panel: queda en castellano y fuera de `[locale]`. Al ser otro
 * root layout, pasar del sitio al panel recarga la pagina entera.
 */
export const metadata: Metadata = {
  title: "Cosmic Eagle | Sabiduría Cósmica para la Evolución Humana",
};

export default function SistemaLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={fontClassName}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
