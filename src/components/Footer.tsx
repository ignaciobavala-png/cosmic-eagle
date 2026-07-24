import { IMAGES } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-void-black border-t border-parchment/10 pt-12 pb-6 px-5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-2 space-y-6">
          <img
            src={IMAGES.logo}
            alt="Cosmic Eagle Logo"
            className="h-10"
          />
          <p className="text-on-surface-variant max-w-sm">
            Viajes Cósmicos para la Evolución Humana. Uniendo sabiduría
            ancestral y tecnología moderna de la conciencia.
          </p>
          <a
            href="mailto:contacto@cosmiceaglejourney.com"
            className="text-primary hover:text-secondary transition-colors block"
          >
            contacto@cosmiceaglejourney.com
          </a>
        </div>
        <div className="space-y-4">
          <h6 className="font-display text-2xl text-primary">Info</h6>
          <ul className="space-y-2">
            <li>
              <a
                href="#"
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                Términos y Condiciones
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                Política de Cancelación
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                Aviso Legal
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                Privacidad
              </a>
            </li>
          </ul>
        </div>
        <div className="space-y-4">
          <h6 className="font-display text-2xl text-primary">Viajes</h6>
          <ul className="space-y-2">
            <li>
              <a
                href="#"
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                Retiros
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                Ceremonias
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-parchment/5 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <p className="text-on-surface-variant text-sm">
          &copy; 2026 Cosmic Eagle Journey. All rights reserved.
        </p>
        <p className="text-on-surface-variant text-sm">
          i.vavala
        </p>
      </div>
    </footer>
  );
}
