import { defineConfig, devices } from "@playwright/test";

// Las credenciales de la cuenta admin de prueba viven en .env.local, que esta
// gitignoreado. Playwright no lee los .env de Next por su cuenta.
process.loadEnvFile?.(".env.local");

/**
 * Tests end-to-end contra el sitio corriendo de verdad.
 *
 * Por que existen, y por que contradicen el "sin testing" de CLAUDE.md: no son
 * cobertura de unidades. Son la unica forma de verificar lo que hasta ahora
 * quedaba siempre pendiente —"sin verificar end-to-end (requiere sesion)"—,
 * porque el panel entero esta detras de un login y buena parte del sitio
 * (campanita, multimedia, portadas, carga de contenidos) no se puede mirar sin
 * una sesion de admin.
 *
 * **Ojo: corren contra la base de Supabase de PRODUCCION.** No hay entorno de
 * staging. Por eso estan partidos en dos proyectos: `lectura` no escribe nada,
 * y `escritura` si, con datos prefijados `E2E` y limpieza al final.
 */
export default defineConfig({
  testDir: "./e2e",
  // Contra una base compartida, dos tests escribiendo a la vez se pisan.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/.report" }]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "es-CL",
  },

  projects: [
    {
      // Corre primero y deja las cookies del admin en e2e/.auth: los proyectos
      // que tocan el panel dependen de el.
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "lectura",
      testMatch: /.*\.lectura\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "panel",
      testMatch: /.*\.panel\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
    },
    {
      name: "lectura-mobile",
      testMatch: /.*\.lectura\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "escritura",
      testMatch: /.*\.escritura\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Reusa el `pnpm dev` que ya este levantado en vez de pelearse con el puerto.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
