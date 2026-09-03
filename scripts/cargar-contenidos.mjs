#!/usr/bin/env node
/**
 * Carga los contenidos de `docs/contenidos/` en Supabase, sin pasar por el
 * panel.
 *
 * Existe porque los primeros textos de la biblioteca llegaron como PDF de Canva
 * (docs/BIBLIOTECA.md) y transcribirlos a mano en el textarea del panel, uno por
 * uno, es lento y no deja historial. Con los `.md` en el repo, el texto se edita
 * con diff y se vuelve a cargar con un comando.
 *
 * **No reemplaza al panel.** `/admin/contenidos` sigue siendo la via de la
 * clienta; esto es la nuestra para la carga inicial y para los textos que
 * transcribimos nosotros.
 *
 *   node scripts/cargar-contenidos.mjs            # carga todo
 *   node scripts/cargar-contenidos.mjs --dry      # muestra que haria
 *   node scripts/cargar-contenidos.mjs --solo=integracion-cosmica
 *
 * Es idempotente: hace upsert por `slug` (articulos) y por autor + seccion
 * (testimonios), asi que correrlo dos veces no duplica nada.
 *
 * **Por que la service role key.** El script corre fuera de Next, sin sesion, y
 * las policies de `articles` y `testimonials` exigen `private.is_admin()`. La
 * alternativa seria loguearse con el mail y la clave del admin, que es meter
 * credenciales de una persona en un script. Es el segundo consumidor de la
 * llave despues del cron de correos (ver src/lib/supabase/admin.ts) y la
 * justificacion es esa. Corre **solo en local**: la llave sale de `.env.local`,
 * que esta gitignoreado.
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = path.join(ROOT, "docs/contenidos");
const COVERS_DIR = path.join(CONTENT_DIR, "covers");
const BUCKET = "site-assets";
const COVER_PREFIX = "articles";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const only = args.find((a) => a.startsWith("--solo="))?.slice("--solo=".length);

// ---------------------------------------------------------------- env + cliente

/** Lee `.env.local` a mano: no vale la pena sumar dotenv por tres variables. */
async function loadEnv() {
  const file = path.join(ROOT, ".env.local");

  if (!existsSync(file)) {
    throw new Error("Falta .env.local en la raiz del proyecto.");
  }

  for (const line of (await readFile(file, "utf8")).split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    // Las comillas son opcionales en un .env y no son parte del valor.
    process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, "");
  }
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ------------------------------------------------------------------ parse de md

/**
 * Frontmatter YAML-ish: `clave: valor` por linea, sin anidar ni listas. Es todo
 * lo que necesitan estos archivos y evita sumar un parser de YAML.
 */
function parseFrontmatter(raw) {
  const text = raw.replace(/\r\n/g, "\n");

  if (!text.startsWith("---\n")) {
    return { meta: {}, body: text.trim() };
  }

  const end = text.indexOf("\n---", 3);
  if (end === -1) return { meta: {}, body: text.trim() };

  const meta = {};
  for (const line of text.slice(4, end).split("\n")) {
    const match = /^([a-z_]+):\s*(.*)$/.exec(line.trim());
    if (match) meta[match[1]] = match[2].trim();
  }

  return { meta, body: text.slice(end + 4).trim() };
}

/**
 * Los comentarios HTML son notas para nosotros y **no** tienen que llegar a la
 * base: el cuerpo se guarda como texto plano y un `<!-- ... -->` se veria tal
 * cual en el sitio.
 */
function stripComments(body) {
  return body.replace(/<!--[\s\S]*?-->/g, "").trim();
}

// -------------------------------------------------------------------- portadas

async function uploadCover(supabase, fileName, slug) {
  const file = path.join(COVERS_DIR, fileName);

  if (!existsSync(file)) {
    console.warn(`  ! portada no encontrada: ${fileName} (se deja sin portada)`);
    return null;
  }

  const bytes = await readFile(file);
  // Ruta estable por slug: volver a correr el script pisa la portada anterior
  // en vez de dejar huerfanas en el bucket.
  const key = `${COVER_PREFIX}/${slug}${path.extname(fileName)}`;

  if (dry) return `[dry] ${key}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, bytes, { contentType: "image/webp", upsert: true });

  if (error) throw new Error(`subiendo ${key}: ${error.message}`);

  return supabase.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
}

// ------------------------------------------------------------------- articulos

async function cargarArticulos(supabase) {
  const files = (await readdir(CONTENT_DIR))
    .filter((f) => f.endsWith(".md"))
    // `_` marca material de referencia que no se publica (el deck de venta).
    .filter((f) => !f.startsWith("_"))
    .filter((f) => f !== "testimonios.md");

  for (const file of files) {
    const { meta, body } = parseFrontmatter(
      await readFile(path.join(CONTENT_DIR, file), "utf8")
    );

    const slug = meta.slug ?? path.basename(file, ".md");
    if (only && only !== slug) continue;

    if (!meta.title) {
      console.warn(`! ${file}: sin title en el frontmatter, se saltea`);
      continue;
    }

    console.log(`\n${slug}`);

    const cover = meta.cover
      ? await uploadCover(supabase, meta.cover, slug)
      : null;

    const row = {
      slug,
      title: meta.title,
      excerpt: meta.excerpt ?? null,
      body: stripComments(body),
      category: meta.category ?? "preparacion",
      status: meta.status ?? "draft",
      ...(cover ? { cover_url: cover } : {}),
    };

    console.log(
      `  ${row.title} · ${row.category} · ${row.status} · ${row.body.length} caracteres`
    );
    if (cover) console.log(`  portada: ${cover}`);

    if (dry) continue;

    // `published_at` no se manda: lo sella el trigger la primera vez que el
    // articulo pasa a publicado, y no se vuelve a tocar.
    const { error } = await supabase
      .from("articles")
      .upsert(row, { onConflict: "slug" });

    if (error) throw new Error(`${slug}: ${error.message}`);
    console.log("  guardado");
  }
}

// ----------------------------------------------------------------- testimonios

/** `## Nombre, Pais` abre un testimonio; lo que sigue hasta el proximo es la cita. */
function parseTestimonios(body) {
  const out = [];
  let current = null;

  for (const block of stripComments(body).split(/\n{2,}/)) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("## ")) {
      const [name, ...rest] = trimmed.slice(3).split(",");
      current = {
        author_name: name.trim(),
        author_location: rest.join(",").trim() || null,
        parts: [],
      };
      out.push(current);
    } else if (current) {
      current.parts.push(trimmed.replace(/\s*\n\s*/g, " "));
    }
  }

  return out.map(({ parts, ...rest }) => ({
    ...rest,
    // La tabla guarda la cita entera; los saltos de parrafo se conservan.
    quote: parts.join("\n\n"),
  }));
}

async function cargarTestimonios(supabase) {
  const file = path.join(CONTENT_DIR, "testimonios.md");
  if (!existsSync(file) || (only && only !== "testimonios")) return;

  const { meta, body } = parseFrontmatter(await readFile(file, "utf8"));
  const placement = meta.placement ?? "home";
  const items = parseTestimonios(body);

  console.log(`\ntestimonios (${placement}): ${items.length}`);

  // Arranca despues del ultimo que ya esta cargado, para no pisar el orden que
  // haya fijado la clienta desde el panel.
  const { data: last } = await supabase
    .from("testimonials")
    .select("sort_order")
    .eq("placement", placement)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  let order = Math.max(10, (last?.sort_order ?? 0) + 1);

  for (const item of items) {
    // Sin unique en la tabla, el "no duplicar" se hace mirando antes: el par
    // autor + seccion alcanza, no hay dos testimonios de la misma persona.
    const { data: existing } = await supabase
      .from("testimonials")
      .select("id")
      .eq("placement", placement)
      .eq("author_name", item.author_name)
      .maybeSingle();

    const label = `  ${item.author_name}${
      item.author_location ? `, ${item.author_location}` : ""
    }`;

    if (dry) {
      console.log(`${label} — ${existing ? "actualizaria" : "crearia"}`);
      continue;
    }

    const { error } = existing
      ? await supabase
          .from("testimonials")
          .update({ ...item, placement })
          .eq("id", existing.id)
      : await supabase
          .from("testimonials")
          .insert({ ...item, placement, sort_order: order++ });

    if (error) throw new Error(`${item.author_name}: ${error.message}`);
    console.log(`${label} — ${existing ? "actualizado" : "creado"}`);
  }
}

// ------------------------------------------------------------------------ main

await loadEnv();
const supabase = client();

if (dry) console.log("Modo --dry: no se escribe nada.\n");

await cargarArticulos(supabase);
await cargarTestimonios(supabase);

console.log("\nListo.");
