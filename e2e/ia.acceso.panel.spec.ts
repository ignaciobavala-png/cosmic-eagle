/**
 * El asistente de IA controla el ACCESO a la biblioteca (que ve cada categoria de
 * usuario y a quien se habilita). A diferencia del resto de `ia.panel.spec.ts`,
 * este SI escribe en la base real: crea un usuario, un articulo / un evento y un
 * codigo de prueba ("Zz ..."), ejecuta los cambios desde el chat aprobando las
 * tarjetas, verifica el estado con la service role y BORRA todo al terminar.
 *
 * Necesita `SUPABASE_SERVICE_ROLE_KEY` y `DEEPSEEK_API_KEY` en el entorno
 * (`set -a; . ./.env.local; set +a`). Llama a DeepSeek (centavos). Deja las
 * tarjetas tal como las vio quien aprueba en `test-results/`.
 */
import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";

test.setTimeout(240_000);
test.describe.configure({ mode: "serial" });

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const NOMBRE = "Zz Prueba Acceso";
const CODIGO = "PRUEBA-ASIST-1";
let userId = "";
let articleId = "";
const log: string[] = [];

async function preguntar(page: Page, texto: string) {
  await page.goto("/admin/ia");
  await page.getByLabel("Mensaje para el asistente").fill(texto);
  await page.getByRole("button", { name: "Enviar" }).click();
}
async function terminar(page: Page) {
  await expect(page.getByRole("button", { name: "Enviar" })).toBeVisible({ timeout: 150_000 });
  const t = (await page.locator(".glass-card .space-y-2").last().innerText()).trim();
  return t;
}
async function tarjeta(page: Page, boton: "Aprobar y aplicar" | "Rechazar", nombre: string) {
  await expect(page.getByRole("button", { name: boton }).first()).toBeVisible({ timeout: 120_000 });
  const card = (await page.locator(".glass-card .space-y-2").last().innerText()).trim();
  log.push(`### ${nombre} — tarjeta\n${card}\n`);
  await page.getByRole("button", { name: boton }).first().click();
  return terminar(page);
}

test.beforeAll(async () => {
  const { data, error } = await admin.auth.admin.createUser({
    email: `zz-prueba-acceso-${Date.now()}@example.invalid`,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { full_name: NOMBRE },
  });
  if (error) throw error;
  userId = data.user!.id;
  const { data: p } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (p) await admin.from("profiles").update({ full_name: NOMBRE }).eq("id", userId);
  else await admin.from("profiles").insert({ id: userId, full_name: NOMBRE } as never);
  const { data: a, error: ae } = await admin
    .from("articles")
    .insert({ title: "Zz Artículo de prueba acceso", slug: `zz-prueba-acceso-${Date.now()}`, category: "preparacion", body: "Texto de prueba.", status: "draft", access_level: "programa" } as never)
    .select("id")
    .single();
  if (ae) throw ae;
  articleId = a.id;
});

test.afterAll(async () => {
  if (articleId) await admin.from("articles").delete().eq("id", articleId);
  await admin.from("access_codes").delete().eq("code", CODIGO);
  if (userId) await admin.auth.admin.deleteUser(userId);
  const { data } = await admin.from("ai_conversations").select("id,title").gte("created_at", new Date(Date.now() - 30 * 60e3).toISOString());
  const ids = (data ?? []).filter((r) => /Zz|PRUEBA-ASIST|prueba del asistente|preparaci|qué ve cada|categor[ií]a de usuario|puede leer|Quitale|Habilit/i.test(r.title)).map((r) => r.id);
  if (ids.length) await admin.from("ai_conversations").delete().in("id", ids);
  mkdirSync("test-results", { recursive: true });
  writeFileSync("test-results/ia-acceso.md", `# Acceso\n\n${log.join("\n")}`);
});

test("leer: qué ve cada categoría y una persona", async ({ page }) => {
  await preguntar(page, "¿Qué ve cada categoría de usuario? Cuántos contenidos hay en cada nivel. Contestá corto.");
  log.push(`## niveles\n${await terminar(page)}\n`);
  await preguntar(page, `¿Qué puede leer ${NOMBRE} y qué no?`);
  const t = await terminar(page);
  log.push(`## persona\n${t}\n`);
  expect(t).toMatch(/cuenta|miembro/i);
});

test("habilitar a una persona, con tarjeta, y queda en la base", async ({ page }) => {
  await preguntar(page, `Habilitá a ${NOMBRE} al programa. Nota: prueba del asistente.`);
  const fin = await tarjeta(page, "Aprobar y aplicar", "habilitar");
  log.push(`### resultado\n${fin}\n`);
  const { data } = await admin.from("content_grants").select("level,revoked_at,note,granted_by").eq("user_id", userId);
  log.push(`DB: ${JSON.stringify(data)}\n`);
  expect(data?.length).toBe(1);
  expect(data![0].level).toBe("programa");
  expect(data![0].revoked_at).toBeNull();
  expect(data![0].granted_by).not.toBeNull();
});

test("quitar el acceso lo revoca sin borrar la fila", async ({ page }) => {
  await preguntar(page, `Quitale el acceso al programa a ${NOMBRE}.`);
  const fin = await tarjeta(page, "Aprobar y aplicar", "quitar");
  log.push(`### resultado\n${fin}\n`);
  const { data } = await admin.from("content_grants").select("revoked_at").eq("user_id", userId);
  expect(data?.length).toBe(1);
  expect(data![0].revoked_at).not.toBeNull();
});

test("cambiar el nivel de un contenido", async ({ page }) => {
  await preguntar(page, "Pasá el artículo 'Zz Artículo de prueba acceso' al nivel «con cuenta».");
  const fin = await tarjeta(page, "Aprobar y aplicar", "contenido");
  log.push(`### resultado\n${fin}\n`);
  const { data } = await admin.from("articles").select("access_level,status").eq("id", articleId).single();
  expect(data!.access_level).toBe("miembros");
  expect(data!.status).toBe("draft"); // no publica
});

test("rechazar un cambio masivo no toca nada", async ({ page }) => {
  const antes = await admin.from("articles").select("id,access_level").eq("category", "preparacion");
  await preguntar(page, "Pasá todos los contenidos de la categoría preparación al nivel del programa.");
  const fin = await tarjeta(page, "Rechazar", "masivo-rechazado");
  log.push(`### resultado\n${fin}\n`);
  const despues = await admin.from("articles").select("id,access_level").eq("category", "preparacion");
  expect(JSON.stringify(despues.data!.sort((a, b) => a.id.localeCompare(b.id)))).toBe(
    JSON.stringify(antes.data!.sort((a, b) => a.id.localeCompare(b.id)))
  );
});

test("crear y apagar un código", async ({ page }) => {
  await preguntar(page, `Creá el código ${CODIGO} para 'prueba del asistente', nivel programa, 1 uso máximo.`);
  const fin = await tarjeta(page, "Aprobar y aplicar", "crear-codigo");
  log.push(`### resultado\n${fin}\n`);
  const { data } = await admin.from("access_codes").select("id,level,max_uses,is_active").eq("code", CODIGO).single();
  expect(data!.level).toBe("programa");
  expect(data!.max_uses).toBe(1);

  await preguntar(page, "Apagá el código 'prueba del asistente'.");
  const fin2 = await tarjeta(page, "Aprobar y aplicar", "apagar-codigo");
  log.push(`### resultado\n${fin2}\n`);
  const { data: d2 } = await admin.from("access_codes").select("is_active").eq("code", CODIGO).single();
  expect(d2!.is_active).toBe(false);
});
