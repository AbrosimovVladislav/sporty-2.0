#!/usr/bin/env node
// Утилита: залить локальный файл в Supabase Storage с заданным именем.
//
// Использование:
//   node scripts/upload-asset.mjs --file /path/to/photo.jpg --bucket venues --name jarys-arena.jpg
//   node scripts/upload-asset.mjs --file /path/to/avatar.jpg --bucket avatars --name player-aleksey-ivanov.jpg
//
// Перезаписывает существующий файл (upsert).

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!existsSync(envPath)) {
    console.error("✗ .env.local не найден");
    process.exit(1);
  }
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const value = t.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseArgs() {
  const out = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) out[a.slice(2)] = argv[++i];
  }
  return out;
}

function contentTypeFor(filename) {
  const ext = filename.toLowerCase().split(".").pop();
  return {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    svg: "image/svg+xml",
    gif: "image/gif",
  }[ext] ?? "application/octet-stream";
}

async function main() {
  loadEnv();

  const { file, bucket, name } = parseArgs();
  if (!file || !bucket || !name) {
    console.error("Usage: --file <path> --bucket <bucket> --name <filename>");
    process.exit(1);
  }
  if (!existsSync(file)) {
    console.error(`✗ Файл не найден: ${file}`);
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("✗ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY не заданы");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const bytes = readFileSync(file);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(name, bytes, {
      contentType: contentTypeFor(name),
      upsert: true,
    });
  if (error) {
    console.error(`✗ Upload failed: ${error.message}`);
    process.exit(1);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(name);
  console.log(`✓ ${bucket}/${name}`);
  console.log(`  ${data.publicUrl}`);
}

main();
