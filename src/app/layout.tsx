import type { Metadata } from "next";
import { Domine, Literata } from "next/font/google";
import "./globals.css";

const domine = Domine({
  subsets: ["latin"],
  variable: "--font-display",
});

const literata = Literata({
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
      className={`${domine.variable} ${literata.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
