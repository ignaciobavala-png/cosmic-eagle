import type { Metadata } from "next";
import { Sorts_Mill_Goudy, Montserrat } from "next/font/google";
import "./globals.css";

/**
 * Display: **Sorts Mill Goudy**, la digitalizacion libre de la Goudy Old Style
 * que pide el manual de marca (`entregas-sofia/2026-09-09-manual-de-marca`).
 *
 * El manual declara **LTC Goudy Old Style**, que es de pago (P22/Lanston) y
 * cuya licencia de escritorio no cubre webfont; los archivos que llegaron son
 * ademas de un sitio pirata. Sorts Mill Goudy sale del mismo original y en el
 * cotejo lado a lado es practicamente indistinguible.
 *
 * **Solo existe en peso 400** (normal e italica): el bold de Goudy Old Style
 * era una fuente aparte y no se digitalizo. Los `font-bold` que quedan sobre
 * `font-display` se resuelven con `font-synthesis-weight: none` en globals.css
 * — ver el comentario de ahi.
 */
const displayFont = Sorts_Mill_Goudy({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Cosmic Eagle | Sabiduría Cósmica para la Evolución Humana",
  description:
    "Cosmic Eagle explora el potencial más profundo de la conciencia humana. A través de experiencias inmersivas, enseñanzas y prácticas de integración, reconectamos con la inteligencia del alma.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${displayFont.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
