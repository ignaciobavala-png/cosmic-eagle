import { test, expect, type Browser, type Page } from "@playwright/test";
import {
  ADMIN_STATE,
  adminClient,
  borrarUsuarioDePrueba,
  emailDePrueba,
  idPorEmail,
  NOMBRE_DE_PRUEBA,
} from "./limpieza";

/**
 * El embudo de inscripción entero, contra la base real:
 *
 *   registro → filtro corto → aprobación → datos de pago → comprobante
 *            → pago registrado → formulario de salud
 *
 * Es lo que venía anotado sesión tras sesión como "sin verificar end-to-end
 * (requiere sesión, la hace Ignacio)". Son siete pantallas y cuatro de ellas
 * sólo existen para alguien con una solicitud en el estado justo, así que no hay
 * forma de mirarlas sin recorrer el camino completo.
 *
 * **Escribe en producción.** Cada corrida crea un usuario nuevo y lo borra al
 * final; el borrado cascadea a todo lo demás (ver `limpieza.ts`). El `finally`
 * no es decorativo: si el test falla a la mitad, la basura se limpia igual.
 */

const CLAVE = "e2e-Prueba-2026!";
const DETALLE_DE_PRUEBA = "E2E: primera vez, sin experiencia previa.";

// Un PNG de 1x1 en memoria: el comprobante sólo tiene que ser un archivo válido
// de un tipo aceptado, no una imagen de verdad.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

/** Un viaje abierto y con precio: sin precio la pantalla no dibuja el bloque de pago. */
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

/** Abre una pestaña con la sesión del admin ya puesta, sin volver a loguearse. */
async function comoAdmin(browser: Browser) {
  const context = await browser.newContext({ storageState: ADMIN_STATE });
  return { context, page: await context.newPage() };
}

async function registrarse(page: Page, email: string, next: string) {
  await page.goto(`/cuenta?modo=registro&next=${encodeURIComponent(next)}`);
  // Por id y no por `name`: el input del newsletter del footer también se llama
  // "email" y está en todas las páginas.
  await page.locator("#full_name").fill(NOMBRE_DE_PRUEBA);
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-password").fill(CLAVE);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  // No se espera la URL `next`: si el registro no deja sesión, el server la
  // sirve un instante y enseguida redirige al login, así que esperar por ella
  // es una carrera.
  await page.waitForLoadState("networkidle");
}

// Son siete pantallas, dos sesiones y varias escrituras contra la base real: no
// entra en el minuto por defecto de Playwright.
test.setTimeout(180_000);


/**
 * Responde que NO en todas las preguntas de sí/no del formulario que esté en
 * pantalla. Desde la corrección del 04/09/2026 son dos opciones obligatorias y
 * no una casilla tildable: dejarlas en blanco ya no envía.
 */
async function responderQueNo(page: Page) {
  const opciones = page.locator('input[type="radio"][value="no"]');
  for (let i = 0; i < (await opciones.count()); i++) {
    await opciones.nth(i).check();
  }
}

test("el embudo completo: del registro al formulario de salud", async ({ page, browser }) => {
  const viaje = await viajeDePrueba();
  const email = emailDePrueba();
  const ruta = `/viajes/${viaje.id}/solicitar`;
  let userId: string | null = null;

  try {
    // ─── 1. Registro, que aterriza directo en el formulario ──────────────────
    await registrarse(page, email, ruta);
    // El id se toma ANTES de comprobar nada: el perfil lo crea el trigger al
    // insertarse el usuario, exista sesión o no, y sin esto un registro fallido
    // dejaría la cuenta sin borrar en cada corrida.
    userId = await idPorEmail(email);

    // Registrarse tiene que DEJAR LA SESIÓN ABIERTA. Si el toggle "Confirm
    // email" del dashboard de Supabase está encendido, `signUp` devuelve el
    // usuario sin sesión: la persona rebota al login y ahí tampoco entra —el
    // Auth responde `invalid_credentials`, que la pantalla muestra como "Email
    // o contraseña incorrectos"—. El diseño de este proyecto es SIN
    // confirmación por mail: el gate real es la aprobación de Estela.
    //
    // Se busca `previous_ceremonies`, que existe SOLO en el filtro corto: el
    // formulario de registro también tiene un `full_name`.
    await expect(
      page.locator('input[name="previous_ceremonies"]'),
      "El registro no dejó la sesión abierta. Revisá que 'Confirm email' siga " +
        "APAGADO en Supabase → Authentication → Sign In / Providers → Email."
    ).toBeVisible({ timeout: 15_000 });

    // ─── 2. Filtro corto ─────────────────────────────────────────────────────
    await page.locator('input[name="full_name"]').fill(NOMBRE_DE_PRUEBA);
    await page.locator('input[name="previous_ceremonies"]').fill("0");
    await page.locator('input[name="residence_country"]').fill("Argentina");
    await responderQueNo(page);
    // Se responde que no a las tres: el detalle sólo es obligatorio cuando la
    // respuesta es sí.
    await page.getByRole("button", { name: /Enviar/i }).click();

    await expect(page.getByText("Tu solicitud está en revisión")).toBeVisible({ timeout: 20_000 });
    // Todavía sin aprobar: los datos bancarios NO tienen que estar en la página.
    await expect(page.getByText("Cómo pagar")).toHaveCount(0);

    const { data: solicitud } = await adminClient()
      .from("applications")
      .select("id, status, payment_status")
      .eq("user_id", userId)
      .single();
    expect(solicitud?.status).toBe("pending_review");

    // ─── 3. El admin aprueba ─────────────────────────────────────────────────
    const admin = await comoAdmin(browser);
    await admin.page.goto(`/admin/solicitudes/${solicitud!.id}`);
    await admin.page.getByRole("button", { name: "Aprobar" }).click();
    await expect(admin.page.getByRole("button", { name: "Aprobar" })).toHaveCount(0, {
      timeout: 20_000,
    });

    // ─── 4. La persona ve los datos de pago ──────────────────────────────────
    await page.reload();
    await expect(page.getByText("Tu solicitud fue aprobada")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cómo pagar" })).toBeVisible();
    // Los rieles cargados el 02/09. Si alguien los desactiva, esto avisa.
    await expect(page.getByText("Transferencia bancaria en euros")).toBeVisible();

    // El botón de tarjeta sólo si este viaje tiene link cargado.
    if (viaje.payment_url) {
      const pagar = page.getByRole("link", { name: "Ir a pagar" });
      await expect(pagar).toBeVisible();
      await expect(pagar).toHaveAttribute("href", viaje.payment_url);
    }

    // ─── 5. Sube el comprobante ──────────────────────────────────────────────
    await page.locator('input[name="proof"]').setInputFiles({
      name: "comprobante.png",
      mimeType: "image/png",
      buffer: PNG_1PX,
    });
    await page.locator('textarea[name="note"], input[name="note"]').first().fill("Pago de prueba E2E");
    await page.getByRole("button", { name: /Enviar el comprobante|Enviar comprobante/i }).click();
    await expect(page.getByText(/Recibimos tu comprobante/)).toBeVisible({ timeout: 30_000 });

    // Subirlo NO marca el pago: eso lo sigue decidiendo Estela.
    const { data: trasComprobante } = await adminClient()
      .from("applications")
      .select("payment_status")
      .eq("id", solicitud!.id)
      .single();
    expect(trasComprobante?.payment_status).toBe("pending");

    // ─── 6. El admin registra el pago ────────────────────────────────────────
    // `goto` y no `reload`: aprobar dispara un server action que renavega, y
    // recargar sobre esa navegación en curso aborta el frame.
    await admin.page.goto(`/admin/solicitudes/${solicitud!.id}`);
    await admin.page.getByRole("button", { name: "Marcar como pagado" }).click();
    await expect(admin.page.getByRole("button", { name: "Marcar como pagado" })).toHaveCount(0, {
      timeout: 20_000,
    });

    // ─── 7. Se abre la etapa 2 ───────────────────────────────────────────────
    await page.reload();
    await expect(page.getByText("Cupo reservado")).toBeVisible();
    await page.getByRole("link", { name: /formulario de salud/i }).click();
    await page.waitForURL(`**/viajes/${viaje.id}/salud`);

    await page.locator('input[name="age"]').fill("34");
    await page.locator('input[name="height"]').fill("1.70m");
    await page.locator('input[name="weight"]').fill("65kg");
    await page.locator('input[name="country"]').fill("Argentina");
    await page.locator('input[name="occupation"]').fill("Prueba automatizada");
    await responderQueNo(page);
    // "Primera vez con plantas" guarda su detalle en `plants_detail`, no en
    // `first_time_plants_detail`: se responde que sí acá para que la asserción
    // de abajo detecte si el nombre se vuelve a desalinear.
    await page
      .locator('input[type="radio"][name="first_time_plants"][value="si"]')
      .check();
    await page.locator('textarea[name="plants_detail"]').fill(DETALLE_DE_PRUEBA);
    await page.getByRole("button", { name: /Enviar/i }).click();

    await page.waitForURL(`**${ruta}`, { timeout: 30_000 });
    await expect(page.getByText("Estás dentro de este viaje")).toBeVisible();

    const { data: salud } = await adminClient()
      .from("health_form_first_time")
      .select("id, first_time_plants, plants_detail")
      .eq("application_id", solicitud!.id)
      .single();
    expect(salud?.first_time_plants).toBe(true);
    expect(salud?.plants_detail).toBe(DETALLE_DE_PRUEBA);

    await admin.context.close();
  } finally {
    if (userId) await borrarUsuarioDePrueba(userId);
  }
});
