/**
 * Correos de ejemplo con datos de mentira: los usa la previsualización de
 * desarrollo (`/api/preview-email`) y la del editor de `/admin/correos`.
 */
import { SolicitudRecibida } from "@/emails/SolicitudRecibida";
import { SolicitudAprobada } from "@/emails/SolicitudAprobada";
import { SolicitudConversemos } from "@/emails/SolicitudConversemos";
import { SolicitudRechazada } from "@/emails/SolicitudRechazada";
import { PagoRegistrado } from "@/emails/PagoRegistrado";
import { RecordatorioSaldo } from "@/emails/RecordatorioSaldo";
import { FormulariosPendientes } from "@/emails/FormulariosPendientes";
import { DatosFinales } from "@/emails/DatosFinales";
import { MensajeEquipo } from "@/emails/MensajeEquipo";
import { CRM_TEMPLATE_NUEVAS_FECHAS } from "@/lib/email/crm-templates";
import type { CopyOverrides } from "@/lib/email/templates";

const VIAJE = "Sesión en Buenos Aires";
const FECHAS = "5 de septiembre de 2026";
const ENLACE = "https://cosmic-eagle.vercel.app/viajes/x/solicitar";

const medios = [
  {
    id: "1",
    label: "Transferencia bancaria en euros",
    audience: "Si estás en Europa o Estados Unidos",
    instructions:
      "Banco: Santander España\nTitular: Maria Ibanez Bulnes\nIBAN: ES1600496077442316183773\nBIC/SWIFT: BSCHESMMXXX",
    currency: "EUR",
    link_url: null,
  },
  {
    id: "2",
    label: "Transferencia a Mercado Pago",
    audience: "Si estás en Chile",
    instructions:
      "Titular: Javiera García Oportot\nRUT: 15378846-4\nNúmero de cuenta: 1012618508",
    currency: "CLP",
    link_url: "https://example.com/pagar",
  },
];

const base = { nombre: "Camila", viaje: VIAJE, fechas: FECHAS, url: ENLACE };

/** Cada entrada es un correo de docs/COMUNICACIONES.md. */
export const PREVIEWS: Record<
  string,
  { titulo: string; template: string; el: (copy?: CopyOverrides) => React.ReactElement }
> = {
  recibida: {
    titulo: "[1] Solicitud recibida",
    template: "recibida",
    el: (copy) => SolicitudRecibida({ ...base, copy }),
  },
  aprobada: {
    titulo: "[2] Solicitud aprobada",
    template: "aprobada",
    el: (copy) => SolicitudAprobada({ ...base, copy, medios, total: 350, sena: 175 }),
  },
  conversemos: {
    titulo: "[2A] Conversemos",
    template: "conversemos",
    el: (copy) => SolicitudConversemos({ copy, nombre: base.nombre, viaje: VIAJE }),
  },
  rechazada: {
    titulo: "[2B] No aprobada",
    template: "rechazada",
    el: (copy) => SolicitudRechazada({ copy, nombre: base.nombre, viaje: VIAJE, url: ENLACE }),
  },
  sena: {
    titulo: "[3A] Cupo reservado con seña",
    template: "pago",
    el: (copy) =>
      PagoRegistrado({
        ...base,
        copy,
        sinCargo: false,
        esSena: true,
        saldoCompletado: false,
        montoPagado: 175,
        saldo: 175,
        necesitaSalud: true,
      }),
  },
  pagado: {
    titulo: "[3] Pago confirmado",
    template: "pago",
    el: (copy) =>
      PagoRegistrado({
        ...base,
        copy,
        sinCargo: false,
        esSena: false,
        saldoCompletado: false,
        montoPagado: 350,
        saldo: 0,
        necesitaSalud: true,
      }),
  },
  completo: {
    titulo: "[3C] Saldo completado",
    template: "pago",
    el: (copy) =>
      PagoRegistrado({
        ...base,
        copy,
        sinCargo: false,
        esSena: false,
        saldoCompletado: true,
        montoPagado: 175,
        saldo: 0,
        necesitaSalud: false,
      }),
  },
  saldo: {
    titulo: "[3B] Recordatorio de saldo",
    template: "saldo",
    el: (copy) =>
      RecordatorioSaldo({ ...base, copy, saldo: 175, fechaLimite: "22 de agosto" }),
  },
  formularios: {
    titulo: "[4A] Formularios pendientes",
    template: "formularios",
    el: (copy) => FormulariosPendientes({ ...base, copy, falta: "ambos" }),
  },
  consentimiento: {
    titulo: "[4A] Falta sólo el consentimiento",
    template: "formularios",
    el: (copy) => FormulariosPendientes({ ...base, copy, falta: "consentimiento" }),
  },
  mensaje: {
    titulo: "[CRM] Mensaje del equipo",
    template: "mensaje",
    el: () =>
      MensajeEquipo({
        nombre: base.nombre,
        asunto: CRM_TEMPLATE_NUEVAS_FECHAS.subject,
        mensaje: CRM_TEMPLATE_NUEVAS_FECHAS.message,
      }),
  },
  datos: {
    titulo: "[7] Datos finales",
    template: "datos",
    el: (copy) =>
      DatosFinales({
        copy,
        nombre: base.nombre,
        viaje: VIAJE,
        cuando: "5 de septiembre de 2026, de 11:00 a 21:00",
        donde: "El Arrayán 1234, Santiago",
        queLlevar: "Ropa cómoda\nUna manta\nBotella de agua\nTu intención escrita",
        llegadas: "Llegada 10:30\nSalida 21:30",
        url: ENLACE,
      }),
  },
};

