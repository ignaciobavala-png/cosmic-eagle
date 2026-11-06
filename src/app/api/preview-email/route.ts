/**
 * Previsualización de los correos en el browser, SÓLO en desarrollo.
 *
 * `/api/preview-email?t=<clave>`, y `?t=lista` devuelve las claves disponibles.
 * Los textos editados desde `/admin/correos` no se aplican acá: se ve el
 * original. **En producción devuelve 404.**
 */
import { render } from "react-email";
import { PREVIEWS } from "@/lib/email/previews";

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
