import { test, expect } from "@playwright/test";

/**
 * El asistente de IA del panel (/admin/ia), etapa 1: solo consulta.
 * Ver el plan en la rama `ia`.
 *
 * Es del proyecto `panel` (sesion de admin) y NO escribe en el negocio: lo unico
 * que deja es filas en `ai_agent_log`, que es justamente el registro de lo que
 * consulta el agente. Llama a DeepSeek de verdad, asi que gasta unos centavos de
 * token por corrida.
 */
test.setTimeout(120_000);

test("el endpoint no atiende sin sesion", async ({ playwright, baseURL }) => {
  // Contexto sin cookies: nada de la sesion del admin.
  const anon = await playwright.request.newContext({
    baseURL,
    storageState: { cookies: [], origins: [] },
  });
  const res = await anon.post("/api/ia/chat", {
    data: { messages: [{ id: "1", role: "user", parts: [{ type: "text", text: "hola" }] }] },
  });
  expect(res.status()).toBe(401);
  await anon.dispose();
});

test("contesta con datos reales y deja el rastro en el log", async ({ page }) => {
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));

  await page.goto("/admin/ia");
  await expect(page.getByRole("heading", { name: "Asistente" })).toBeVisible();

  await page.getByLabel("Mensaje para el asistente").fill(
    "¿Cuántos viajes y sesiones hay cargados? Contestá corto."
  );
  await page.getByRole("button", { name: "Enviar" }).click();

  // Uso la herramienta (rastro visible) y termino de contestar (vuelve "Enviar").
  await expect(page.getByText(/Consultó viajes y sesiones/).first()).toBeVisible({ timeout: 90_000 });
  await expect(page.getByRole("button", { name: "Enviar" })).toBeVisible({ timeout: 90_000 });

  // La respuesta es texto, y el razonamiento del modelo no se filtra a la pantalla.
  const respuesta = page.locator(".glass-card .space-y-2").last();
  await expect(respuesta).not.toBeEmpty();
  await expect(page.getByText(/reasoning/i)).toHaveCount(0);
  expect(errores, "errores de JS").toEqual([]);
});

test("el correo al equipo pide aprobacion y, rechazado, no sale", async ({ page }) => {
  await page.goto("/admin/ia");
  await page.getByLabel("Mensaje para el asistente").fill(
    'Mandale un correo a todo el equipo con asunto "Prueba del asistente" y mensaje "Esto es una prueba, ignorar."'
  );
  await page.getByRole("button", { name: "Enviar" }).click();

  // Aparece el borrador con los botones; nada salio todavia.
  await expect(page.getByText("Correo al equipo")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByRole("button", { name: "Aprobar y enviar" })).toBeVisible();

  await page.getByRole("button", { name: "Rechazar" }).click();
  await expect(page.getByText("Rechazaste este correo: no se envió.")).toBeVisible({ timeout: 90_000 });
});

test("la burbuja esta en las pantallas del panel, sabe donde estas y no aparece en /admin/ia", async ({ page }) => {
  await page.goto("/admin/solicitudes");
  const fab = page.getByRole("button", { name: "Abrir el asistente" });
  await expect(fab).toBeVisible();

  await fab.click();
  const ventana = page.getByRole("dialog", { name: "Asistente" });
  await expect(ventana).toBeVisible();
  await expect(ventana.getByText("Estás en: Solicitudes")).toBeVisible();

  // La charla sobrevive a la navegacion: se abre, se pregunta, se cambia de pantalla.
  await ventana.getByRole("button", { name: "¿Cómo reviso y apruebo una solicitud?" }).click();
  await expect(ventana.getByRole("button", { name: "Enviar" })).toBeVisible({ timeout: 90_000 });
  await expect(ventana.getByText(/Estela/i).first()).toBeVisible();

  // Esc cierra y devuelve el foco al boton.
  await page.keyboard.press("Escape");
  await expect(ventana).toBeHidden();
  await expect(fab).toBeFocused();

  // En /admin/ia ya esta el chat completo: no hay burbuja.
  await page.goto("/admin/ia");
  await expect(page.getByRole("button", { name: "Abrir el asistente" })).toHaveCount(0);
});

test("la conversacion se guarda y aparece en el historial", async ({ page }) => {
  await page.goto("/admin/ia");
  await page.getByLabel("Mensaje para el asistente").fill("¿Cuántas sesiones hay abiertas? Contestá corto.");
  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByRole("button", { name: "Enviar" })).toBeVisible({ timeout: 90_000 });

  // Se guarda al terminar el turno; el historial la lista por su primer mensaje.
  await page.getByRole("button", { name: "Historial" }).click();
  await expect(page.getByText("¿Cuántas sesiones hay abiertas? Contestá corto.").last()).toBeVisible({ timeout: 15_000 });
});

test("crear un viaje pide aprobacion, avisa que sera borrador y, rechazado, no crea nada", async ({ page }) => {
  await page.goto("/admin/ia");
  await page.getByLabel("Mensaje para el asistente").fill(
    "Creá una sesión: ciudad Santiago, país Chile, el 2027-03-06 (un solo día), cupo 14, precio 120 dólares, sin seña, sin título. Ya tenés todos los datos, creala."
  );
  await page.getByRole("button", { name: "Enviar" }).click();

  await expect(page.getByText("Nuevo viaje o sesión")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText(/Se crea como BORRADOR/)).toBeVisible();
  await page.getByRole("button", { name: "Rechazar" }).click();
  await expect(page.getByText("Rechazaste crear este viaje: no se creó.")).toBeVisible({ timeout: 90_000 });
});
