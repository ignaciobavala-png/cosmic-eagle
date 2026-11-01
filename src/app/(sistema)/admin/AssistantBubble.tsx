"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Maximize2, Sparkles, X } from "lucide-react";
import { ChatInterface } from "./ia/ChatInterface";

/**
 * Burbuja del asistente: flota en TODAS las pantallas del panel (menos en
 * /admin/ia, donde ya esta el chat entero) y sabe en cual esta la persona.
 *
 * Decisiones de UX:
 * - Vive en el layout, asi que **la charla sobrevive a la navegacion**: se puede
 *   preguntar en Solicitudes, ir a Pagos y seguir.
 * - Cerrada NO se desmonta (solo se oculta): si el asistente esta contestando
 *   mientras se cierra, la respuesta no se pierde, y la burbuja avisa con un punto.
 * - En celular es una hoja a pantalla completa; en escritorio, una ventana
 *   anclada abajo a la derecha que no tapa el contenido de la pagina.
 * - Las sugerencias cambian con la pantalla: lo primero que se ofrece es lo que
 *   probablemente se necesite ahi.
 * - Solo transiciones CSS (con `motion-reduce`): el arbol no cambia con la
 *   preferencia de movimiento reducido.
 */
type Pantalla = { prefijo: string; nombre: string; sugerencias: string[] };

const PANTALLAS: Pantalla[] = [
  {
    prefijo: "/admin/solicitudes",
    nombre: "Solicitudes",
    sugerencias: [
      "¿Cómo reviso y apruebo una solicitud?",
      "¿Cómo confirmo un pago?",
      "¿Qué solicitudes esperan revisión?",
    ],
  },
  {
    prefijo: "/admin/pagos",
    nombre: "Pagos",
    sugerencias: ["¿Qué ve la persona cuando la aprueban?", "¿Cómo cargo un medio de cobro nuevo?", "¿Cuánto llevamos cobrado?"],
  },
  {
    prefijo: "/admin/crm",
    nombre: "CRM",
    sugerencias: [
      "¿Cómo le mando un correo a un grupo?",
      "¿Qué significa viajero, solicitante y potencial?",
      "¿Cuántas personas hay por país?",
    ],
  },
  {
    prefijo: "/admin/sesiones",
    nombre: "Sesiones",
    sugerencias: ["¿Cómo creo una sesión nueva?", "¿Cuántos lugares quedan en cada una?", "¿Qué pasa con un borrador?"],
  },
  {
    prefijo: "/admin/viajes",
    nombre: "Retiros",
    sugerencias: ["¿Cómo creo un retiro nuevo?", "¿Cuántos lugares quedan?", "¿Cómo abro las inscripciones?"],
  },
  {
    prefijo: "/admin/experiencias",
    nombre: "Experiencias",
    sugerencias: ["¿Cómo se completa el formulario?", "¿Qué diferencia hay entre borrador y abierto?", "¿Cuántos lugares quedan?"],
  },
  {
    prefijo: "/admin/multimedia",
    nombre: "Multimedia",
    sugerencias: ["¿Cómo cambio una imagen del sitio?", "¿Cómo cambio un texto de la home?", "¿Por qué no me sube un video?"],
  },
  {
    prefijo: "/admin/contenidos",
    nombre: "Contenidos",
    sugerencias: ["¿Cómo publico un artículo?", "¿Qué es cada nivel de acceso?", "¿Cómo comparto un contenido?"],
  },
  {
    prefijo: "/admin/testimonios",
    nombre: "Testimonios",
    sugerencias: ["¿Cómo agrego un testimonio?", "¿Dónde se ven en el sitio?"],
  },
  {
    prefijo: "/admin/faqs",
    nombre: "Preguntas frecuentes",
    sugerencias: ["¿Cómo agrego una pregunta?", "¿Cómo oculto una que todavía no está lista?"],
  },
  {
    prefijo: "/admin/legales",
    nombre: "Legales",
    sugerencias: ["¿Qué datos faltan completar?", "¿Por qué importa el país?"],
  },
  {
    prefijo: "/admin/material",
    nombre: "Envío material",
    sugerencias: ["¿Cómo envío un documento?", "¿Cómo comparto el link?", "¿Qué formato tiene que tener?"],
  },
  {
    prefijo: "/admin/acceso",
    nombre: "Niveles de acceso",
    sugerencias: ["¿Tengo que habilitar a cada persona?", "¿Para qué sirven los códigos?"],
  },
  {
    prefijo: "/admin/suscriptores",
    nombre: "Suscriptores",
    sugerencias: ["¿De dónde salen estos correos?", "¿Cuántos suscriptores hay?"],
  },
  {
    prefijo: "/admin/notificaciones",
    nombre: "Notificaciones",
    sugerencias: ["¿Hay avisos sin leer?", "¿Qué significa un aviso de correo fallido?"],
  },
];

const DASHBOARD: Pantalla = {
  prefijo: "/admin",
  nombre: "Dashboard",
  sugerencias: ["¿Cómo está todo hoy?", "¿Qué falta para abrir el sitio al público?", "¿Hay avisos sin leer?"],
};

const GENERALES = ["¿Cómo funciona esta pantalla?", "¿Qué puedo preguntarte?"];

function pantallaDe(pathname: string): Pantalla {
  if (pathname === "/admin") return DASHBOARD;
  return PANTALLAS.find((p) => pathname.startsWith(p.prefijo)) ?? { prefijo: pathname, nombre: "el panel", sugerencias: [] };
}

const SEEN_KEY = "ce-asistente-visto";

export function AssistantBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const [hint, setHint] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);
  const wasBusy = useRef(false);

  // La invitacion ("¿Dudas?") se muestra una sola vez por navegador, despues de
  // un momento: no compite con lo que la persona vino a hacer.
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    if (seen) return;
    const show = setTimeout(() => setHint(true), 2500);
    const hide = setTimeout(() => setHint(false), 12000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    fabRef.current?.focus();
  }, []);

  function openPanel() {
    setOpen(true);
    setUnread(false);
    setHint(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // Si el asistente termina de contestar con la ventana cerrada, un punto lo avisa.
  const onBusyChange = useCallback(
    (busy: boolean) => {
      if (wasBusy.current && !busy && !open) setUnread(true);
      wasBusy.current = busy;
    },
    [open]
  );

  // En /admin/ia ya esta el chat completo.
  if (pathname.startsWith("/admin/ia")) return null;

  const pantalla = pantallaDe(pathname);
  const sugerencias = [...pantalla.sugerencias, ...GENERALES].slice(0, 4);

  return (
    <div className="print:hidden">
      {/* Ventana. Cerrada se oculta pero sigue montada: la charla no se pierde. */}
      <section
        role="dialog"
        aria-label="Asistente"
        aria-hidden={!open}
        inert={!open}
        className={`fixed z-[60] flex flex-col overflow-hidden bg-surface-container-low shadow-2xl shadow-black/50 transition-[opacity,transform] duration-200 motion-reduce:transition-none inset-0 sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[min(40rem,calc(100dvh-9.5rem))] sm:w-[25rem] sm:rounded-2xl sm:border sm:border-primary-fixed-dim/30 ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none invisible translate-y-3 opacity-0"
        }`}
      >
        <header className="flex items-center gap-3 border-b border-outline-variant/40 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-container text-on-primary"
          >
            <Sparkles size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-on-surface leading-tight">Asistente</p>
            <p className="truncate text-xs text-on-surface-variant">Estás en: {pantalla.nombre}</p>
          </div>
          <Link
            href="/admin/ia"
            onClick={() => setOpen(false)}
            aria-label="Abrir en pantalla completa"
            title="Abrir en pantalla completa"
            className="rounded-lg p-2 text-on-surface-variant hover:bg-primary-container/10 hover:text-on-surface transition-colors"
          >
            <Maximize2 size={16} />
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar el asistente"
            className="rounded-lg p-2 text-on-surface-variant hover:bg-primary-container/10 hover:text-on-surface transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 pb-[env(safe-area-inset-bottom)]">
          <ChatInterface
            variant="bubble"
            pagina={pathname}
            suggestions={sugerencias}
            active={open}
            onBusyChange={onBusyChange}
          />
        </div>
      </section>

      {/* Invitacion de la primera vez. */}
      {hint && !open && (
        <button
          type="button"
          onClick={openPanel}
          className="fixed bottom-[5.25rem] right-5 z-40 max-w-[15rem] rounded-xl border border-primary-fixed-dim/40 bg-surface-container-low px-4 py-2.5 text-left text-sm text-on-surface shadow-xl shadow-black/40"
        >
          ¿Dudas con esta pantalla? <span className="text-primary-fixed-dim">Preguntame.</span>
        </button>
      )}

      {/* Boton flotante. En celular, con la ventana abierta, se oculta: la hoja ya tiene su cierre. */}
      <button
        ref={fabRef}
        type="button"
        onClick={() => (open ? close() : openPanel())}
        aria-label={open ? "Cerrar el asistente" : "Abrir el asistente"}
        aria-expanded={open}
        className={`fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-primary-container text-on-primary shadow-xl shadow-black/40 transition-[transform,background-color] hover:bg-primary-fixed active:scale-95 motion-reduce:transition-none mb-[env(safe-area-inset-bottom)] ${
          open ? "max-sm:hidden" : ""
        }`}
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
        {unread && !open && (
          <span
            aria-label="Respuesta nueva"
            className="absolute right-0.5 top-0.5 size-3.5 rounded-full border-2 border-surface bg-error"
          />
        )}
      </button>
    </div>
  );
}
