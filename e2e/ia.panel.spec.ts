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
