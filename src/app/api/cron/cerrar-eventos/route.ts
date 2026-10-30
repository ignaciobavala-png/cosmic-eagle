import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cron diario: pasa a `completed` los viajes y sesiones cuya fecha de fin ya
 * pasó y que siguen `open` o `closed`. Nadie lo hacía a mano, y el asistente de
 * IA (y la cartelera) tomaban por vigente un evento que ya sucedió.
 *
 * Mismo criterio de autenticación que `/api/cron/emails`: sin `CRON_SECRET` no
 * atiende a nadie. Usa el service role porque corre sin sesión (la RLS de
 * `trips` deja escribir solo a admin).
 *
 * `end_date` es `date` sin hora: "hoy" se calcula en Buenos Aires, y un evento
 * que termina hoy se cierra mañana.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/cerrar-eventos] falta CRON_SECRET: no se corre");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Falta la service role key" }, { status: 500 });
  }

  const hoy = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());

  const { data, error } = await supabase
    .from("trips")
    .update({ status: "completed" })
    .in("status", ["open", "closed"])
    .lt("end_date", hoy)
    .select("id, title");

  if (error) {
    console.error(`[cron/cerrar-eventos] ${error.message}`);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Lo público es estático con ISR: sin esto la cartelera tarda en enterarse.
  if (data.length) revalidatePath("/", "layout");

  console.log(`[cron/cerrar-eventos] ${JSON.stringify({ cerrados: data.map((t) => t.title) })}`);
  return NextResponse.json({ ok: true, cerrados: data, ranAt: new Date().toISOString() });
}
