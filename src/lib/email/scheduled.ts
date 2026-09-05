import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "./resend";
import { MAX_SENDS_PER_RUN, SCHEDULE, SEND_INTERVAL_MS } from "./schedule-config";
import { RecordatorioSaldo } from "@/emails/RecordatorioSaldo";
import { FormulariosPendientes } from "@/emails/FormulariosPendientes";
import { DatosFinales } from "@/emails/DatosFinales";
import { formatTripHours } from "@/lib/trip-fields";
import { formatDateRangeCompact } from "@/lib/format";
import type { Enums } from "@/lib/supabase/types";

/**
 * El barrido de correos programados. Lo llama el cron diario
 * (`src/app/api/cron/emails/route.ts`) y no hay otro consumidor.
 *
 * Es el motor que faltaba: hasta hoy **todos** los mails de la app salian de un
 * server action, o sea que siempre habia alguien apretando un boton. Los correos
 * [3B], [4A], [6], [7], [8] y [9] del documento de Sofia no tienen boton — los
 * dispara el calendario— y por eso ninguno existia.
 *
 * Como no hay accion humana, tampoco hay "estado anterior" que releer para no
 * remandar, que es el truco de `reviewApplication` y `markPayment`. Ese papel lo
 * cumple `scheduled_email_log`: una fila por (solicitud, tipo), con indice
 * unico.
 *
 * ## Por que corre con la service role key
 *
 * El cron no tiene sesion. Con `anon`, la RLS de `applications` no le muestra
 * una sola fila, y no existe forma de "loguear" a un proceso sin prestarle las
 * credenciales de una persona. Ver `src/lib/supabase/admin.ts`.
 *
 * ## Los cuatro correos que faltan
 *
 * `preparation`, `final_details`, `integration` y `feedback` ya son valores del
 * enum y tienen su plazo en `schedule-config.ts`, pero **no se mandan**: los
 * cuatro necesitan contenido que todavia no existe (la ruta `/preparacion`, los
 * campos de logistica de `trips` —direccion, hora, que llevar—, el material de
 * integracion y el formulario de feedback). Agregarlos es escribir una regla
 * mas en `dueEmails()` y su template; el motor no se toca.
 */

type Kind = Enums<"scheduled_email_kind">;

export type ScheduledEmailRun = {
  /** Cuantos correos salieron de verdad. */
  sent: number;
  /** Resend rechazo el envio. Queda anotado en la casilla del panel. */
  failed: number;
  /**
   * Correspondian pero Resend todavia no esta configurado. **No se registran**:
   * el dia que se verifique el dominio tienen que salir, no aparecer como ya
   * enviados. Es el estado del proyecto hoy mismo.
   */
  skipped: number;
  /** Quedaron para la corrida siguiente por el tope por corrida. */
  deferred: number;
};

/** Postgres `date` es "YYYY-MM-DD" y hay que leerlo en UTC o se corre un dia. */
function parseDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`);
}

function todayUTC() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

function daysBetween(from: Date, to: Date) {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/** "12 de octubre". Sin año: siempre es una fecha de las proximas semanas. */
function formatDeadline(date: Date) {
  return date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

type Candidate = {
  id: string;
  full_name: string;
  email: string;
  trip_id: string;
  previous_ceremonies: number;
  payment_status: Enums<"payment_status">;
  amount_paid: number;
  paid_at: string | null;
  trips: {
    title: string;
    start_date: string;
    end_date: string;
    price: number;
    status: Enums<"trip_status">;
    address: string | null;
    arrival_notes: string | null;
    packing_list: string | null;
    start_time: string | null;
    end_time: string | null;
  } | null;
  /**
   * **Objeto o `null`, no un arreglo.** La FK es one-to-one (indice unico sobre
   * `application_id`) y PostgREST devuelve el hijo suelto; tratarlo como lista
   * revienta con "Cannot read properties of null". El log de al lado si es un
   * arreglo, porque su unico es compuesto (solicitud + tipo).
   */
  health_form_first_time: { id: string } | null;
  consents: { id: string } | null;
  scheduled_email_log: { kind: Kind }[] | null;
};

type Pending = {
  applicationId: string;
  kind: Kind;
  to: string;
  subject: string;
  react: React.ReactNode;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cosmic-eagle.vercel.app";

/**
 * Que correos le corresponden hoy a una solicitud.
 *
 * Devuelve varios porque nada impide que dos caigan el mismo dia (alguien que
 * paga la sena tarde y ademas no completo el formulario). El tope por corrida y
 * el registro se aplican despues, iguales para todos.
 */
function dueEmails(app: Candidate, today: Date): Pending[] {
  const trip = app.trips;
  if (!trip) return [];

  // Un borrador no le manda correos a nadie: la RLS de `trips` deja leerlos y el
  // filtro de borradores se hace siempre del lado del codigo (ver CLAUDE.md).
  if (trip.status === "draft") return [];

  const start = parseDate(trip.start_date);
  const daysUntilStart = daysBetween(today, start);

  // Ningun correo de esta tanda tiene sentido con el viaje ya empezado: los que
  // van despues ([8] integracion, [9] feedback) todavia no existen.
  if (daysUntilStart < 0) return [];

  const yaEnviado = new Set((app.scheduled_email_log ?? []).map((r) => r.kind));
  const nombre = app.full_name.split(" ")[0];
  const fechas = formatDateRangeCompact(trip.start_date, trip.end_date);
  const due: Pending[] = [];

  const pago =
    app.payment_status === "paid" ||
    app.payment_status === "deposit_paid" ||
    app.payment_status === "waived";

  // ---------------------------------------------------------------------
  // [7] Datos finales
  //
  // Va primero de las tres: es la unica con una fecha dura detras (el viaje
  // empieza), y como sale un correo programado por corrida, el que se posterga
  // tiene que ser el que puede esperar un dia.
  // ---------------------------------------------------------------------
  if (
    !yaEnviado.has("final_details") &&
    pago &&
    daysUntilStart <= SCHEDULE.FINAL_DETAILS_DAYS &&
    // Sin direccion ni lista no hay datos que dar, y un correo que promete
    // "aca van los datos" y no trae ninguno es peor que no escribir.
    (trip.address || trip.packing_list)
  ) {
    const hora = formatTripHours(trip.start_time, trip.end_time);

    due.push({
      applicationId: app.id,
      kind: "final_details",
      to: app.email,
      subject: `Todo lo que necesitas saber para llegar a ${trip.title}`,
      react: DatosFinales({
        nombre,
        viaje: trip.title,
        cuando: hora ? `${fechas}, de ${hora}` : fechas,
        donde: trip.address,
        queLlevar: trip.packing_list,
        llegadas: trip.arrival_notes,
        url: `${SITE_URL}/viajes/${app.trip_id}/solicitar`,
      }),
    });
  }

  // ---------------------------------------------------------------------
  // [3B] Recordatorio de saldo
  // ---------------------------------------------------------------------
  const saldo = Math.max(0, trip.price - app.amount_paid);
  const diasDesdePago = app.paid_at
    ? daysBetween(parseDate(app.paid_at.slice(0, 10)), today)
    : 0;

  if (
    !yaEnviado.has("payment_reminder") &&
    app.payment_status === "deposit_paid" &&
    saldo > 0 &&
    // La ventana arranca en el vencimiento menos el aviso previo. Quien entra en
    // este estado mas tarde que eso lo recibe en la corrida siguiente, no nunca.
    daysUntilStart <=
      SCHEDULE.BALANCE_DUE_DAYS + SCHEDULE.BALANCE_REMINDER_LEAD_DAYS &&
    diasDesdePago >= SCHEDULE.MIN_DAYS_AFTER_PAYMENT
  ) {
    const limite = new Date(start);
    limite.setUTCDate(limite.getUTCDate() - SCHEDULE.BALANCE_DUE_DAYS);

    due.push({
      applicationId: app.id,
      kind: "payment_reminder",
      to: app.email,
      subject: "Recordatorio de tu saldo pendiente",
      react: RecordatorioSaldo({
        nombre,
        viaje: trip.title,
        fechas,
        saldo,
        // Si el corte ya paso —una Sesion reservada sobre la fecha— el mail sale
        // sin nombrarlo. Ver el comentario del template.
        fechaLimite: limite > today ? formatDeadline(limite) : null,
        url: `${SITE_URL}/viajes/${app.trip_id}/solicitar`,
      }),
    });
  }

  // ---------------------------------------------------------------------
  // [4A] Formularios pendientes
  // ---------------------------------------------------------------------
  // Solo las primerizas tienen etapa 2: no existe `health_form_returning`. El
  // consentimiento, en cambio, lo firma todo el mundo.
  const faltaSalud =
    app.previous_ceremonies === 0 && !app.health_form_first_time;
  const faltaConsentimiento = !app.consents;

  if (
    !yaEnviado.has("forms_pending") &&
    pago &&
    (faltaSalud || faltaConsentimiento) &&
    diasDesdePago >= SCHEDULE.FORMS_GRACE_DAYS
  ) {
    due.push({
      applicationId: app.id,
      kind: "forms_pending",
      to: app.email,
      subject: "Te faltan unos pasos para completar tu inscripción",
      react: FormulariosPendientes({
        nombre,
        viaje: trip.title,
        fechas,
        falta: faltaSalud ? "ambos" : "consentimiento",
        // El link va al paso que corresponde; el de salud, cuando falta,
        // siempre va primero.
        url: `${SITE_URL}/viajes/${app.trip_id}/${faltaSalud ? "salud" : "consentimiento"}`,
      }),
    });
  }

  return due;
}

export async function runScheduledEmails(): Promise<
  ScheduledEmailRun & { ok: boolean; error?: string }
> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY sin configurar",
      sent: 0,
      failed: 0,
      skipped: 0,
      deferred: 0,
    };
  }

  const today = todayUTC();

  // Una sola consulta con los hijos que hacen falta para decidir: el formulario
  // de salud (si llego) y el registro de lo ya enviado. Traer el log aca evita
  // una segunda vuelta por solicitud.
  const { data, error } = await supabase
    .from("applications")
    .select(
      `id, full_name, email, trip_id, previous_ceremonies, payment_status,
       amount_paid, paid_at,
       trips!inner (title, start_date, end_date, price, status,
                    address, arrival_notes, packing_list, start_time, end_time),
       health_form_first_time (id),
       consents (id),
       scheduled_email_log (kind)`
    )
    .eq("status", "approved")
    // `!inner` no es decorativo: sin el, un filtro sobre una tabla embebida no
    // descarta la fila padre y el `.gte` de abajo no filtra nada.
    // El resto de las condiciones se resuelve en JS: son decenas de filas, y las
    // reglas mezclan fechas derivadas con hijos, que en SQL serian tres vistas.
    .gte("trips.start_date", today.toISOString().slice(0, 10));

  if (error) {
    return {
      ok: false,
      error: error.message,
      sent: 0,
      failed: 0,
      skipped: 0,
      deferred: 0,
    };
  }

  // **Un correo programado por persona y por corrida.** `dueEmails` puede
  // devolver dos el mismo dia —quien pago la sena tarde y ademas no completo el
  // formulario cae en las dos reglas— y recibir dos correos automaticos juntos
  // se lee como un sistema descontrolado. El que queda sale en la corrida
  // siguiente, porque el barrido es idempotente. El orden de `dueEmails` decide
  // cual gana: primero el saldo, que es el que tiene fecha.
  const pending = (data as unknown as Candidate[]).flatMap(
    (app) => dueEmails(app, today).slice(0, 1)
  );

  const run: ScheduledEmailRun = {
    sent: 0,
    failed: 0,
    skipped: 0,
    deferred: Math.max(0, pending.length - MAX_SENDS_PER_RUN),
  };

  for (const [index, mail] of pending.slice(0, MAX_SENDS_PER_RUN).entries()) {
    // Secuencial y espaciado: Resend corta a ~2 pedidos por segundo.
    if (index > 0) await new Promise((r) => setTimeout(r, SEND_INTERVAL_MS));

    const result = await sendEmail({
      to: mail.to,
      subject: mail.subject,
      react: mail.react,
    });

    // Sin API key no se registra nada. Es la diferencia entre "este mail fallo"
    // y "el sistema todavia no esta encendido": si dejara la fila, el dia que se
    // verifique el dominio en Resend estos envios ya estarian dados por hechos.
    if (!result.ok && result.reason === "not_configured") {
      run.skipped += 1;
      continue;
    }

    await supabase.from("scheduled_email_log").insert({
      application_id: mail.applicationId,
      kind: mail.kind,
      ok: result.ok,
      error: result.ok ? null : (result.error ?? "sin detalle"),
    });

    if (result.ok) {
      run.sent += 1;
      continue;
    }

    run.failed += 1;

    // Un fallo real no se reintenta: queda la fila con `ok = false` y el aviso en
    // la casilla del panel, para que alguien escriba a mano. Reintentar todos los
    // dias repetiria el mismo aviso hasta que alguien lo mire.
    await supabase.from("admin_notifications").insert({
      kind: "email_failed",
      title: `No salió el correo programado para ${mail.to}`,
      body: `Resend rechazó "${mail.subject}": ${result.error ?? "sin detalle"}. No se reintenta: escríbele a mano.`,
      href: `/admin/solicitudes/${mail.applicationId}`,
    });
  }

  return { ok: true, ...run };
}
