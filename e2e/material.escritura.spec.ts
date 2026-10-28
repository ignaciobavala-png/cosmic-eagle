import { test, expect } from "@playwright/test";
import path from "node:path";
import { ADMIN_STATE, adminClient } from "./limpieza";

/**
 * "Envio material" de punta a punta (28/10): armar un documento en el panel
 * con fotos reales subidas a Storage, compartirlo, abrirlo por link SIN sesion
 * y dejar de compartir. Ver docs/MATERIAL.md.
 *
 * Escribe en la base de PRODUCCION, asi que todo lo que crea lleva el prefijo
 * `E2E` y se borra al final (fila + archivos del bucket) con la service role.
 */
const TITULO = "E2E Material de prueba";
const FOTO = path.join(__dirname, "..", "public", "img", "portal-1.webp");

test.use({ storageState: ADMIN_STATE });
// Dos subidas reales a Storage y varias rutas que `next dev` compila en frio.
test.setTimeout(180_000);

async function limpiar() {
  const admin = adminClient();
  const { data } = await admin
    .from("materiales")
    .select("id, cover_url, back_cover_url, blocks")
    .like("title", "E2E%");

  const prefix = "/storage/v1/object/public/site-assets/";
  const paths: string[] = [];
  for (const row of data ?? []) {
    const urls = [
      row.cover_url,
      row.back_cover_url,
      ...((row.blocks as { url?: string }[]) ?? []).map((b) => b.url),
    ];
    for (const url of urls) {
      const p = url?.split(prefix)[1];
      if (p) paths.push(decodeURIComponent(p));
    }
  }
  if (paths.length) await admin.storage.from("site-assets").remove(paths);
  if (data?.length) {
    await admin
      .from("materiales")
      .delete()
      .in("id", data.map((r) => r.id));
  }
}

test.beforeAll(limpiar);
test.afterAll(limpiar);

test("armar, compartir y abrir un documento sin sesion", async ({
  page,
  browser,
}) => {
  await page.goto("/admin/material/nuevo");
  await page.getByLabel("Título del documento").fill(TITULO);
  await page.getByLabel(/Línea chica de la tapa/).fill("Cuaderno de prueba");

  // La tapa se sube de verdad: comprime en el browser y sube a Storage.
  const inputs = page.locator('input[type="file"]');
  await inputs.nth(0).setInputFiles(FOTO);
  await expect(page.locator("img").first()).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: "Capítulo", exact: true }).click();
  await page.getByPlaceholder("Recuperar el poder:").fill("Primer capítulo:");
  await page.getByPlaceholder("Liberar condicionamientos…").fill("el comienzo");

  await page.getByRole("button", { name: "Texto", exact: true }).click();
  await page
    .locator("textarea")
    .first()
    .fill("Un **párrafo** de prueba.\n\nOtro párrafo, separado.");

  await page.getByRole("button", { name: "Frase destacada" }).click();
  await page.locator("textarea").nth(1).fill("Una frase en letra grande.");

  await page.getByRole("button", { name: "Imagen", exact: true }).click();
  // 0 tapa, 1 contratapa, 2 la imagen del bloque.
  await inputs.nth(2).setInputFiles(FOTO);
  await expect(page.getByRole("button", { name: "Quitar la imagen" }).nth(1)).toBeVisible({
    timeout: 30_000,
  });

  // La vista previa dibuja el formato final.
  await page.getByRole("tab", { name: "Vista previa" }).click();
  await expect(
    page.getByRole("heading", { name: TITULO, level: 1 })
  ).toBeVisible();
  // Dentro del documento: el editor (oculto) tiene el mismo texto en su textarea.
  const doc = page.getByRole("article");
  await expect(doc.getByText("Una frase en letra grande.")).toBeVisible();
  await expect(doc.locator("strong", { hasText: "párrafo" })).toBeVisible();

  await page.getByRole("button", { name: "Crear documento" }).click();
  await page.waitForURL(/\/admin\/material\/[0-9a-f-]{36}\/editar/);
  const id = page.url().match(/material\/([0-9a-f-]{36})\//)![1];

  // Lo guardado vuelve completo al reabrir el editor.
  await expect(page.getByLabel("Título del documento")).toHaveValue(TITULO);
  await expect(page.getByPlaceholder("Recuperar el poder:")).toHaveValue(
    "Primer capítulo:"
  );

  // Compartir crea el token en la base.
  await page.getByRole("button", { name: "Compartir" }).click();
  await expect(page.getByRole("button", { name: "Copiar link" })).toBeVisible();

  const admin = adminClient();
  const { data: row } = await admin
    .from("materiales")
    .select("share_token")
    .eq("id", id)
    .single();
  expect(row?.share_token).toMatch(/^[0-9a-f]{32}$/);

  // Quien recibe el link NO tiene sesion: contexto nuevo.
  const visitor = await browser.newContext();
  const pub = await visitor.newPage();
  await pub.goto(`/material/${row!.share_token}`);
  await expect(
    pub.getByRole("heading", { name: TITULO, level: 1 })
  ).toBeVisible();
  await expect(pub.getByText("Una frase en letra grande.")).toBeVisible();
  await expect(pub.getByRole("button", { name: "Guardar como PDF" })).toBeVisible();
  // No se indexa, y no lleva el chrome del sitio.
  await expect(pub.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/
  );
  await expect(pub.getByRole("link", { name: "Cosmic Eagle" })).toHaveCount(0);

  // Un token inventado no abre nada.
  const fake = await pub.goto("/material/00000000000000000000000000000000");
  expect(fake?.status()).toBe(404);

  // Dejar de compartir corta el link en el acto.
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Dejar de compartir" }).click();
  await expect(page.getByRole("button", { name: "Compartir" })).toBeVisible();
  const gone = await pub.goto(`/material/${row!.share_token}`);
  expect(gone?.status()).toBe(404);

  await visitor.close();
});
