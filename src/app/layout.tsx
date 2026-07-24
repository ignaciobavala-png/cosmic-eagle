import type { Metadata } from "next";
import { EB_Garamond, Montserrat } from "next/font/google";
import "./globals.css";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
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
      className={`${ebGaramond.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
