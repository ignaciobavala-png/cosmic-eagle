import { ChatInterface } from "./ChatInterface";

/**
 * Asistente de IA del panel (etapa 1: solo consulta). El acceso a la ruta ya lo
 * guarda el layout del admin; el endpoint `/api/ia/chat` vuelve a verificar la
 * sesion por su cuenta, porque es un endpoint y no una pagina.
 */
export default function AdminIaPage() {
  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl text-primary-fixed-dim mb-3">
        Asistente
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-on-surface-variant">
        Preguntale por los viajes, las solicitudes, el CRM, los contenidos o los
        avisos, o pedile ayuda con el panel. Puede crear viajes, artículos y
        testimonios como borrador y mandar correos al equipo, siempre con tu
        aprobación. Ve nombres, pero no mails, teléfonos ni datos de salud.
      </p>
      <ChatInterface />
    </div>
  );
}
