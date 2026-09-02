import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export const ADMIN_STATE = path.join(__dirname, ".auth", "admin.json");

/**
 * Inicia sesion UNA vez y guarda las cookies. Todos los tests del panel parten
 * de ese estado en vez de loguearse de nuevo: son ~20 navegaciones menos y,
 * sobre todo, un solo login contra el Auth de produccion.
 *
 * Las credenciales salen de .env.local (gitignoreado), no del codigo.
 */
setup("iniciar sesion como admin", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Faltan E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD en .env.local " +
        "(salen de ~/Escritorio/account/cosmic-eagle-acces.txt)."
    );
  }

  await page.goto("/cuenta");
  await page.getByLabel("Email").fill(email);
  // `getByLabel` matchea tambien el ojito de mostrar/ocultar, que tiene
  // `aria-label="Mostrar contraseña"`. Se apunta al textbox.
  await page.getByRole("textbox", { name: "Contraseña" }).fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();

  // El login de un admin redirige directo al panel (ver cuenta/actions.ts).
  await page.waitForURL("**/admin", { timeout: 30_000 });
  await expect(
    page.getByRole("link", { name: /Cosmic Eagle · Admin|CE · Admin/ })
  ).toBeVisible();

  fs.mkdirSync(path.dirname(ADMIN_STATE), { recursive: true });
  await page.context().storageState({ path: ADMIN_STATE });
});
