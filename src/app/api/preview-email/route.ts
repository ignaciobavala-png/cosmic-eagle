/**
 * Previsualización de los correos en el browser, SÓLO en desarrollo.
 *
 * Un mail no se puede mirar de otra forma sin mandarlo, y hoy no sale ninguno
 * (falta verificar el dominio en Resend). Con esto se abre cada template con
 * datos de mentira: `/api/preview-email?t=<clave>`, y `?t=lista` devuelve las
 * claves disponibles en JSON.
 *
 * **En producción devuelve 404**: los datos de ejemplo son inventados pero la
 * ruta no tiene por qué existir de cara al público.
 */
import { render } from "react-email";
import { SolicitudRecibida } from "@/emails/SolicitudRecibida";
import { SolicitudAprobada } from "@/emails/SolicitudAprobada";
import { SolicitudConversemos } from "@/emails/SolicitudConversemos";
import { SolicitudRechazada } from "@/emails/SolicitudRechazada";
import { PagoRegistrado } from "@/emails/PagoRegistrado";
import { RecordatorioSaldo } from "@/emails/RecordatorioSaldo";
import { FormulariosPendientes } from "@/emails/FormulariosPendientes";
import { DatosFinales } from "@/emails/DatosFinales";

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
export const PREVIEWS: Record<string, { titulo: string; el: () => React.ReactElement }> = {
  recibida: {
    titulo: "[1] Solicitud recibida",
    el: () => SolicitudRecibida(base),
  },
  aprobada: {
    titulo: "[2] Solicitud aprobada",
    el: () => SolicitudAprobada({ ...base, medios, total: 350, sena: 175 }),
  },
  conversemos: {
    titulo: "[2A] Conversemos",
    el: () => SolicitudConversemos({ nombre: base.nombre, viaje: VIAJE }),
  },
  rechazada: {
    titulo: "[2B] No aprobada",
    el: () => SolicitudRechazada({ nombre: base.nombre, viaje: VIAJE, url: ENLACE }),
  },
  sena: {
    titulo: "[3A] Cupo reservado con seña",
    el: () =>
      PagoRegistrado({
        ...base,
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
    el: () =>
      PagoRegistrado({
        ...base,
        sinCargo: false,
        esSena: false,
        saldoCompletado: false,
        montoPagado: 350,
        saldo: 0,
        necesitaSalud: true,
      }),
  },
  saldo: {
    titulo: "[3B] Recordatorio de saldo",
    el: () =>
      RecordatorioSaldo({ ...base, saldo: 175, fechaLimite: "22 de agosto" }),
  },
  formularios: {
    titulo: "[4A] Formularios pendientes",
    el: () => FormulariosPendientes({ ...base, falta: "ambos" }),
  },
  consentimiento: {
    titulo: "[4A] Falta sólo el consentimiento",
    el: () => FormulariosPendientes({ ...base, falta: "consentimiento" }),
  },
  datos: {
    titulo: "[7] Datos finales",
    el: () =>
      DatosFinales({
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

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("No encontrado", { status: 404 });
  }

  const which = new URL(request.url).searchParams.get("t") ?? "aprobada";

  if (which === "lista") {
    return Response.json(
      Object.entries(PREVIEWS).map(([clave, { titulo }]) => ({ clave, titulo }))
    );
  }

  const preview = PREVIEWS[which];
  if (!preview) return new Response("No hay un correo con esa clave", { status: 404 });

  return new Response(await render(preview.el()), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
