import { test, expect, type Browser, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  ADMIN_STATE,
  adminClient,
  borrarUsuarioDePrueba,
  emailDePrueba,
  idPorEmail,
  NOMBRE_DE_PRUEBA,
} from "./limpieza";

/**
 * El mismo embudo que verifica `inscripcion.escritura.spec.ts`, pero con una
 * captura de cada pantalla, para que Sofía y Estela vean el recorrido completo
 * sin tener que crearse una cuenta ni entrar al panel.
 *
 * Las imágenes quedan fuera del repo, en la carpeta del escritorio que se pasa
 * por `CAPTURAS_DIR`.
 *
 * **Escribe en producción**, igual que el otro: crea un usuario por corrida y lo
 * borra en el `finally`.
 */

const DESTINO =
  process.env.CAPTURAS_DIR ??
  path.join(process.env.HOME ?? "", "Escritorio", "flujo de pagos y formulario");

const CLAVE = "e2e-Prueba-2026!";

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

// Con las animaciones de scroll activas, una captura de página entera sale con
// medio contenido en opacidad 0: todo lo que anima respeta `prefers-reduced-
// motion` y con `reduce` el sitio se aplana a texto normal.
test.use({
  viewport: { width: 1440, height: 900 },
  contextOptions: { reducedMotion: "reduce" },
});

type Paso = { archivo: string; titulo: string; detalle: string; actor: string };
const pasos: Paso[] = [];
let n = 0;

async function capturar(
  page: Page,
  titulo: string,
  detalle: string,
  actor: "Viajera" | "Estela (panel)"
) {
  n += 1;
  const slug = titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const archivo = `${String(n).padStart(2, "0")}-${slug}.png`;

  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  // En una captura de página entera el navbar fijo queda flotando en el medio,
  // y el badge del overlay de `next dev` se cuela en una esquina. Los dos
  // sobran en algo que va a mirar la clienta.
  // El navbar público es fijo y la página le reserva el hueco arriba, así que
  // se lo ancla al tope. El del panel es pegajoso y NO reserva hueco: ahí hay
  // que devolverlo al flujo o tapa el título de la pantalla.
  const enElPanel = page.url().includes("/admin");
  await page.addStyleTag({
    content: `nextjs-portal { display: none !important; }
              header { position: ${enElPanel ? "static" : "absolute"} !important;
                       top: 0 !important; left: 0; right: 0; width: 100% !important; }`,
  });
  await page.screenshot({ path: path.join(DESTINO, archivo), fullPage: true });

  pasos.push({ archivo, titulo, detalle, actor });
}

async function viajeDePrueba() {
  const { data, error } = await adminClient()
    .from("trips")
    .select("id, title, payment_url")
    .eq("status", "open")
    .gt("price", 0)
    .order("start_date")
    .limit(1)
    .single();

  if (error || !data) throw new Error(`No hay ningún viaje abierto con precio: ${error?.message}`);
  return data;
}

async function comoAdmin(browser: Browser) {
  const context = await browser.newContext({
    storageState: ADMIN_STATE,
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  return { context, page: await context.newPage() };
}

test.setTimeout(300_000);

test("recorrido de la inscripción, pantalla por pantalla", async ({ page, browser }) => {
  fs.mkdirSync(DESTINO, { recursive: true });

  const viaje = await viajeDePrueba();
  const email = emailDePrueba();
  const ruta = `/viajes/${viaje.id}/solicitar`;
  let userId: string | null = null;

  try {
    // ─── 1. La cartelera y el viaje ──────────────────────────────────────────
    await page.goto("/viajes");
    await capturar(
      page,
      "Cartelera de experiencias",
      "Desde el sitio público, sin sesión: las sesiones y los viajes abiertos.",
      "Viajera"
    );

    await page.goto(`/viajes/${viaje.id}`);
    await capturar(
      page,
      "Detalle de la experiencia",
      `Página pública de «${viaje.title}»: fechas, lugar, programa, aporte y condiciones. El botón de inscripción es lo único que pide cuenta.`,
      "Viajera"
    );

    // ─── 2. Registro ─────────────────────────────────────────────────────────
    await page.goto(`/cuenta?modo=registro&next=${encodeURIComponent(ruta)}`);
    await capturar(
      page,
      "Crear cuenta",
      "Al tocar «Quiero inscribirme» sin sesión, se pide crear la cuenta. Después del registro vuelve sola al formulario del viaje.",
      "Viajera"
    );

    await page.locator("#full_name").fill(NOMBRE_DE_PRUEBA);
    await page.locator("#signup-email").fill(email);
    await page.locator("#signup-password").fill(CLAVE);
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator('input[name="previous_ceremonies"]'),
      "El registro no dejó la sesión abierta. Revisá que 'Confirm email' siga " +
        "APAGADO en Supabase → Authentication → Sign In / Providers → Email."
    ).toBeVisible({ timeout: 15_000 });
    userId = await idPorEmail(email);

    // ─── 3. Filtro corto (etapa 1) ───────────────────────────────────────────
    await capturar(
      page,
      "Formulario de inscripción (paso 1)",
      "El filtro corto, con el encuadre informativo: las tres preguntas de salud no cierran la puerta, sólo hacen que la solicitud llegue marcada para revisar a mano.",
      "Viajera"
    );

    await page.locator('input[name="full_name"]').fill(NOMBRE_DE_PRUEBA);
    await page.locator('input[name="previous_ceremonies"]').fill("0");
    await capturar(
      page,
      "Formulario de inscripción completado",
      "El mismo formulario con los datos cargados, tal como lo envía la persona.",
      "Viajera"
    );

    await page.getByRole("button", { name: /Enviar/i }).click();
    await expect(page.getByText("Tu solicitud está en revisión")).toBeVisible({ timeout: 20_000 });
    await capturar(
      page,
      "Solicitud en revisión",
      "Lo que ve la persona mientras espera. Todavía no aparecen los datos de pago: recién se muestran cuando la solicitud está aprobada.",
      "Viajera"
    );

    const { data: solicitud } = await adminClient()
      .from("applications")
      .select("id")
      .eq("user_id", userId)
      .single();

    // ─── 4. El panel: revisión y aprobación ──────────────────────────────────
    const admin = await comoAdmin(browser);
    await admin.page.goto("/admin/solicitudes");
    await capturar(
      admin.page,
      "Panel: listado de solicitudes",
      "Todas las inscripciones con su estado y su estado de pago.",
      "Estela (panel)"
    );

    await admin.page.goto(`/admin/solicitudes/${solicitud!.id}`);
    await capturar(
      admin.page,
      "Panel: la solicitud",
      "Las respuestas del filtro, y los tres botones de revisión: Aprobar, Conversemos y Rechazar.",
      "Estela (panel)"
    );

    await admin.page.getByRole("button", { name: "Aprobar" }).click();
    await expect(admin.page.getByRole("button", { name: "Aprobar" })).toHaveCount(0, {
      timeout: 20_000,
    });
    await capturar(
      admin.page,
      "Panel: solicitud aprobada",
      "Aprobada. Se dispara el correo de aprobación —que lleva los datos de pago— y se habilitan los controles de cobro.",
      "Estela (panel)"
    );

    // ─── 5. Los datos de pago ────────────────────────────────────────────────
    await page.reload();
    await expect(page.getByText("Tu solicitud fue aprobada")).toBeVisible();
    await capturar(
      page,
      "Cómo pagar",
      "Aprobada: aparecen los medios de cobro que Estela carga desde el panel, el monto, y —si el viaje tiene seña— la opción de pagar el total o la seña.",
      "Viajera"
    );

    // ─── 6. El comprobante ───────────────────────────────────────────────────
    await page.locator('input[name="proof"]').setInputFiles({
      name: "comprobante.png",
      mimeType: "image/png",
      buffer: PNG_1PX,
    });
    await page.locator('textarea[name="note"], input[name="note"]').first()
      .fill("Transferencia del 02/09, banco Santander.");
    await capturar(
      page,
      "Comprobante cargado",
      "La persona adjunta el comprobante (imagen o PDF) y puede dejar una nota.",
      "Viajera"
    );

    await page.getByRole("button", { name: /Enviar el comprobante|Enviar comprobante/i }).click();
    await expect(page.getByText(/Recibimos tu comprobante/)).toBeVisible({ timeout: 30_000 });
    await capturar(
      page,
      "Comprobante enviado",
      "Subir el comprobante NO marca el pago: el aviso llega al panel y el pago lo confirma Estela mirando el archivo.",
      "Viajera"
    );

    // ─── 7. El panel registra el pago ────────────────────────────────────────
    await admin.page.goto(`/admin/solicitudes/${solicitud!.id}`);
    await capturar(
      admin.page,
      "Panel: comprobante recibido",
      "El comprobante se abre desde el panel con un link temporal —el archivo vive en un bucket privado— y desde ahí se registra el pago.",
      "Estela (panel)"
    );

    await admin.page.getByRole("button", { name: "Marcar como pagado" }).click();
    await expect(admin.page.getByRole("button", { name: "Marcar como pagado" })).toHaveCount(0, {
      timeout: 20_000,
    });
    await capturar(
      admin.page,
      "Panel: pago registrado",
      "Con el pago registrado se abre la segunda etapa: el formulario de salud extenso.",
      "Estela (panel)"
    );

    // ─── 8. Formulario de salud (etapa 2) ────────────────────────────────────
    await page.reload();
    await expect(page.getByText("Cupo reservado")).toBeVisible();
    await capturar(
      page,
      "Cupo reservado",
      "La persona ve el pago confirmado y el paso siguiente: completar el formulario de salud.",
      "Viajera"
    );

    await page.getByRole("link", { name: /formulario de salud/i }).click();
    await page.waitForURL(`**/viajes/${viaje.id}/salud`);
    await capturar(
      page,
      "Formulario de salud (paso 2)",
      "El formulario extenso, el que hoy se manda por WhatsApp. Sólo se abre con la solicitud aprobada y el pago registrado.",
      "Viajera"
    );

    await page.locator('input[name="age"]').fill("34");
    await page.locator('input[name="height"]').fill("1.70m");
    await page.locator('input[name="weight"]').fill("65kg");
    await page.locator('input[name="country"]').fill("Argentina");
    await page.locator('input[name="occupation"]').fill("Prueba automatizada");
    await capturar(
      page,
      "Formulario de salud completado",
      "Los datos quedan guardados y sólo los ve el panel: no se exponen en la cuenta de la persona.",
      "Viajera"
    );

    await page.getByRole("button", { name: /Enviar/i }).click();
    await page.waitForURL(`**${ruta}`, { timeout: 30_000 });
    await expect(page.getByText("Estás dentro de este viaje")).toBeVisible();
    await capturar(
      page,
      "Inscripción completa",
      "Fin del recorrido: inscripción aprobada, pagada y con el formulario de salud entregado.",
      "Viajera"
    );

    // ─── 9. Su espacio personal ──────────────────────────────────────────────
    await page.goto("/cuenta");
    await capturar(
      page,
      "Su espacio personal",
      "«Tu espacio personal», el que nombran seis de los catorce correos: los viajes confirmados y el estado de cada solicitud, con el paso siguiente.",
      "Viajera"
    );

    await admin.context.close();
  } finally {
    fs.writeFileSync(path.join(DESTINO, "pasos.json"), JSON.stringify(pasos, null, 2));
    if (userId) await borrarUsuarioDePrueba(userId);
  }
});
