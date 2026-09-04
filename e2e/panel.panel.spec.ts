import { test, expect } from "@playwright/test";

/**
 * El panel de admin, con la sesion ya iniciada por `auth.setup.ts`.
 *
 * Esto es lo que cierra la deuda que venia arrastrandose: la campanita de
 * avisos, el acordeon de Multimedia, los listados y los formularios nunca se
 * habian mirado porque estan detras del login.
 *
 * No escribe nada: entra, mira y se va.
 */

const SECCIONES = [
  { href: "/admin", titulo: /Dashboard|Panel/i },
  // Ojo con los nombres: el 02/09 las rutas se renombraron con la nomenclatura
  // de Julia (Sesiones / Viajes) y el CRUD se mudo a /admin/experiencias. Estas
  // tres lineas quedaron apuntando a las viejas y el suite fallaba desde
  // entonces.
  { href: "/admin/sesiones", titulo: /Sesiones/i },
  { href: "/admin/viajes", titulo: /Viajes/i },
  { href: "/admin/solicitudes", titulo: /Solicitudes/i },
  { href: "/admin/pagos", titulo: /Pagos|cobro/i },
  { href: "/admin/multimedia", titulo: /Multimedia/i },
  { href: "/admin/contenidos", titulo: /Contenidos/i },
  { href: "/admin/testimonios", titulo: /Testimonios/i },
  { href: "/admin/faqs", titulo: /Preguntas frecuentes/i },
  { href: "/admin/crm", titulo: /CRM/i },
  { href: "/admin/suscriptores", titulo: /Suscriptores/i },
  { href: "/admin/notificaciones", titulo: /Avisos|Notificaciones/i },
];

for (const seccion of SECCIONES) {
  test(`${seccion.href} abre sin errores`, async ({ page }) => {
    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));

    const res = await page.goto(seccion.href);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: seccion.titulo }).first()).toBeVisible();
    expect(errores, `errores de JS en ${seccion.href}`).toEqual([]);
  });
}

test("el desplegable de secciones lista todas y navega", async ({ page }) => {
  await page.goto("/admin");

  // Acotado a `nav`: en dev, el boton de las Dev Tools de Next tambien lleva
  // `aria-haspopup="menu"` y colisiona.
  const disparador = page.locator("nav button[aria-haspopup='menu']");
  await expect(disparador).toHaveAttribute("aria-expanded", "false");
  await disparador.click();
  await expect(disparador).toHaveAttribute("aria-expanded", "true");

  // Los items llevan `role="menuitem"`, que PISA el rol implicito de <a>: por
  // eso no aparecen como `link`. Es correcto para un menu, pero hay que
  // buscarlos por ese rol.
  const items = page.getByRole("menuitem");
  // Las 12 secciones de `LINKS` en AdminNav. Avisos no esta ahi: se llega por
  // la campanita. El numero es a proposito: si una seccion se cae del menu, el
  // panel la esconde sin avisar y nadie se entera.
  await expect(items).toHaveCount(12);
  for (const label of [
    "Dashboard", "Sesiones", "Viajes", "Solicitudes", "Pagos",
    "Multimedia", "Contenidos", "Testimonios", "Preguntas frecuentes",
    "Privacidad y Términos", "CRM", "Suscriptores",
  ]) {
    await expect(items.filter({ hasText: label })).toHaveCount(1);
  }

  await items.filter({ hasText: "Multimedia" }).click();
  await expect(page).toHaveURL(/\/admin\/multimedia/);

  // Navegar cierra el menu solo (el estado guarda EN QUE ruta se abrio).
  await expect(page.locator("nav button[aria-haspopup='menu']")).toHaveAttribute(
    "aria-expanded",
    "false"
  );
});

test("la campanita de avisos abre la casilla", async ({ page }) => {
  await page.goto("/admin");

  const campanita = page.getByRole("link", { name: /avisos|notificaciones/i }).first();
  await expect(campanita).toBeVisible();
  await campanita.click();
  await expect(page).toHaveURL(/\/admin\/notificaciones/);
});

test("Multimedia: el acordeón despliega los grupos de slots", async ({ page }) => {
  await page.goto("/admin/multimedia");

  const grupos = page.locator("details");
  expect(await grupos.count()).toBeGreaterThan(1);

  // El PRIMER grupo viene abierto a proposito (`open={i === 0}` en la pagina),
  // asi que se prueba el segundo: cerrado -> abierto -> cerrado.
  await expect(grupos.first()).toHaveAttribute("open", "");

  const segundo = grupos.nth(1);
  const cuerpo = segundo.locator("> :not(summary)").first();
  await expect(cuerpo).toBeHidden();
  await segundo.locator("summary").click();
  await expect(cuerpo).toBeVisible();
  await segundo.locator("summary").click();
  await expect(cuerpo).toBeHidden();

  // El grupo nuevo de FAQs tiene que estar listado (registro de slots).
  await expect(page.getByText("Preguntas frecuentes").first()).toBeVisible();
});

test("los formularios de alta abren con sus campos", async ({ page }) => {
  await page.goto("/admin/faqs/nuevo");
  await expect(page.getByLabel(/¿En qué bloque va\?/)).toBeVisible();
  await expect(page.getByLabel("Pregunta")).toBeVisible();
  await expect(page.getByLabel("Respuesta")).toBeVisible();

  await page.goto("/admin/experiencias/nuevo?tipo=ceremonia");
  await expect(page.getByLabel(/Título/i).first()).toBeVisible();

  // Los campos de logistica del 03/09. Ciudad y pais son obligatorios porque
  // `trips.location` se genera de ellos.
  await expect(page.getByLabel("Ciudad")).toBeVisible();
  await expect(page.getByLabel("País")).toBeVisible();
  await expect(page.getByLabel("Hora de inicio")).toBeVisible();
  await expect(page.getByLabel("A quién está dirigida")).toBeVisible();
  // "Antes de llegar" arranca plegado: son los campos que se completan cuando
  // la fecha se acerca, no al crear la experiencia.
  await expect(page.getByLabel("Qué llevar")).toBeHidden();
  await page.getByText(/Antes de llegar/).click();
  await expect(page.getByLabel("Qué llevar")).toBeVisible();
  // "Qué incluye" es solo del Viaje: en una Sesion no existe ni plegado.
  await expect(page.getByLabel("Qué incluye")).toHaveCount(0);

  await page.goto("/admin/experiencias/nuevo?tipo=retiro");
  await page.getByText(/Antes de llegar/).click();
  await expect(page.getByLabel("Qué incluye")).toBeVisible();

  await page.goto("/admin/pagos");
  await expect(page.getByText(/medio de cobro|instrucciones/i).first()).toBeVisible();
});

test("sin sesión el panel redirige a /cuenta", async ({ browser }) => {
  // Contexto limpio, sin las cookies del setup.
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await ctx.newPage();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/cuenta/);
  await ctx.close();
});
