import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { runScheduledEmails } from "@/lib/email/scheduled";

/**
 * Cron diario de correos programados. Ver `src/lib/email/scheduled.ts`.
 *
 * **La autenticacion es distinta a la del keep-alive, a proposito.** Alla, si
 * `CRON_SECRET` no esta cargada la ruta queda abierta, y no pasa nada: lo peor
 * que consigue un desconocido es hacer un `select` de una fila. Aca la ruta
 * manda correos a personas reales y gasta cuota de Resend, asi que sin secreto
 * **no atiende a nadie**: falta de configuracion es 401, no barra libre.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[cron/emails] falta CRON_SECRET: no se corre el barrido");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runScheduledEmails();

  // El resumen se loguea ademas de devolverse: la respuesta del cron la ve
  // Vercel y nadie mas, y los logs alcanzan para saber si el barrido corrio.
  console.log(`[cron/emails] ${JSON.stringify(result)}`);

  return NextResponse.json(
    { ...result, ranAt: new Date().toISOString() },
    { status: result.ok ? 200 : 500 }
  );
}
