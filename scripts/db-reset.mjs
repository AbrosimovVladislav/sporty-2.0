#!/usr/bin/env node
// Полный сброс БД и пересидинг тестовых данных. Storage НЕ трогается.
//
// Использование:
//   npm run db:reset            # с подтверждением y/N
//   npm run db:reset -- --yes   # без подтверждения
//
// Переменные окружения берёт из .env.local. Чтобы случайно не дропнуть прод,
// падает если NEXT_PUBLIC_SUPABASE_URL не указывает на DEV-проект.

import { readFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

import {
  wipeDatabase,
  seedDistricts,
  seedVenues,
  seedPlayers,
  seedTeams,
  seedMemberships,
  seedEvents,
  seedAttendancesAndFinances,
} from "./seed/seed.mjs";

const ALLOWED_PROJECT_REF = "nxahiklyhwducxoqimoq"; // DEV; на prod просто другой ref

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
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function confirm(message) {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(message);
  rl.close();
  return answer.trim().toLowerCase() === "y";
}

function log(msg) {
  console.log(msg);
}

async function main() {
  loadEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("✗ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY не заданы");
    process.exit(1);
  }

  if (!url.includes(ALLOWED_PROJECT_REF)) {
    console.error(`✗ Скрипт разрешён только на DEV-проекте (${ALLOWED_PROJECT_REF}).`);
    console.error(`  Текущий URL: ${url}`);
    process.exit(1);
  }

  const yes = process.argv.includes("--yes") || process.argv.includes("-y");
  if (!yes) {
    log("⚠️  Скрипт сейчас:");
    log("    1. Удалит ВСЕ данные из БД (users, teams, events, venues, …)");
    log("    2. Засеет тестовые данные (12 районов, 12 площадок, 100 игроков, 6 команд, события)");
    log("    Storage НЕ трогается — файлы аватаров/лого/фото остаются на месте.");
    log(`    Проект: ${url}`);
    log("");
    const ok = await confirm("Продолжить? [y/N]: ");
    if (!ok) {
      log("Отменено.");
      process.exit(0);
    }
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const start = Date.now();

  log("\n→ Очистка БД");
  await wipeDatabase(supabase, log);

  log("\n→ Сидинг районов");
  const districtMap = await seedDistricts(supabase, log);

  log("\n→ Сидинг игроков");
  const playerRows = await seedPlayers(supabase, log, districtMap);

  const systemUserId = playerRows[0].id;

  log("\n→ Сидинг площадок");
  const venueRows = await seedVenues(supabase, log, districtMap, systemUserId);

  log("\n→ Сидинг команд");
  const { teamRows, distribution } = await seedTeams(supabase, log, playerRows);

  log("\n→ Сидинг membership");
  await seedMemberships(supabase, log, playerRows, teamRows, distribution);

  log("\n→ Сидинг событий");
  const { eventRows, eventToTeamPlayers } = await seedEvents(
    supabase, log, teamRows, distribution, playerRows, venueRows,
  );

  log("\n→ Сидинг явки и финансов");
  await seedAttendancesAndFinances(supabase, log, eventRows, eventToTeamPlayers);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  log(`\n✓ Готово за ${elapsed}s. Запускай аппку и проходи онбординг с нуля.`);
}

main().catch((e) => {
  console.error("\n✗ Ошибка:", e.message);
  if (e.stack) console.error(e.stack);
  process.exit(1);
});
