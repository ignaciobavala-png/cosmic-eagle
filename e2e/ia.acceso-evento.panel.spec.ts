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
const NOMBRE = "Zz Prueba Evento";
const EVENTO = "Zz Evento prueba acceso";
let userId = "", tripId = "", appId = "";
const log: string[] = [];

async function preguntar(page: Page, texto: string) {
  await page.goto("/admin/ia");
  await page.getByLabel("Mensaje para el asistente").fill(texto);
  await page.getByRole("button", { name: "Enviar" }).click();
}
async function aprobar(page: Page, nombre: string) {
  await expect(page.getByRole("button", { name: "Aprobar y aplicar" }).first()).toBeVisible({ timeout: 120_000 });
  log.push(`### ${nombre} — tarjeta\n${(await page.locator(".glass-card .space-y-2").last().innerText()).trim()}\n`);
  await page.getByRole("button", { name: "Aprobar y aplicar" }).first().click();
  await expect(page.getByRole("button", { name: "Enviar" })).toBeVisible({ timeout: 150_000 });
  log.push(`### ${nombre} — resultado\n${(await page.locator(".glass-card .space-y-2").last().innerText()).trim().split("\n").slice(-3).join("\n")}\n`);
}

test.beforeAll(async () => {
  const { data, error } = await admin.auth.admin.createUser({
    email: `zz-evento-${Date.now()}@example.invalid`, password: crypto.randomUUID(), email_confirm: true, user_metadata: { full_name: NOMBRE },
  });
  if (error) throw error;
  userId = data.user!.id;
  const { data: p } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (p) await admin.from("profiles").update({ full_name: NOMBRE }).eq("id", userId);
  const { data: t, error: te } = await admin.from("trips").insert({
    title: EVENTO, type: "ceremonia", status: "draft", city: "Prueba", country: "Argentina",
    start_date: "2027-03-01", end_date: "2027-03-01", capacity: 5, price: 10,
  } as never).select("id").single();
  if (te) throw te;
  tripId = t.id;
  const { data: a, error: ae } = await admin.from("applications").insert({
    user_id: userId, trip_id: tripId, full_name: NOMBRE, email: "zz@example.invalid", residence_country: "Argentina",
    serious_illness: false, mental_health_treatment: false, current_medication: false,
  } as never).select("id").single();
  if (ae) throw ae;
  appId = a.id;
  const { error: ue } = await admin.from("applications").update({ status: "approved" } as never).eq("id", appId);
  if (ue) throw ue;
});

test.afterAll(async () => {
  await admin.from("admin_notifications").delete().eq("application_id", appId);
  await admin.from("content_grants").delete().eq("user_id", userId);
  await admin.from("applications").delete().eq("id", appId);
  await admin.from("trips").delete().eq("id", tripId);
  if (userId) await admin.auth.admin.deleteUser(userId);
  const { data } = await admin.from("ai_conversations").select("id,title").gte("created_at", new Date(Date.now() - 30 * 60e3).toISOString());
  const ids = (data ?? []).filter((r) => /Zz|evento|Habilit|Quit/i.test(r.title)).map((r) => r.id);
  if (ids.length) await admin.from("ai_conversations").delete().in("id", ids);
  mkdirSync("test-results", { recursive: true });
  writeFileSync("test-results/ia-evento.md", `# Evento\n\n${log.join("\n")}`);
});

test("el trigger habilitó al aprobar (punto de partida)", async () => {
  const { data } = await admin.from("content_grants").select("id,revoked_at,application_id").eq("user_id", userId);
  expect(data?.length).toBe(1);
  expect(data![0].revoked_at).toBeNull();
});

test("quitar a todos los aprobados del evento", async ({ page }) => {
  await preguntar(page, `Quitá el acceso al programa a todas las personas aprobadas del evento «${EVENTO}».`);
  await aprobar(page, "quitar-evento");
  const { data } = await admin.from("content_grants").select("revoked_at").eq("user_id", userId);
  expect(data?.length).toBe(1);
  expect(data![0].revoked_at).not.toBeNull();
});

test("volver a habilitar reactiva la misma fila (no duplica)", async ({ page }) => {
  await preguntar(page, `Habilitá al programa a todas las personas aprobadas del evento «${EVENTO}».`);
  await aprobar(page, "habilitar-evento");
  const { data } = await admin.from("content_grants").select("revoked_at").eq("user_id", userId);
  expect(data?.length).toBe(1);
  expect(data![0].revoked_at).toBeNull();
});
