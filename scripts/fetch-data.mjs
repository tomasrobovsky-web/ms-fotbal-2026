/**
 * Jednorázový script pro stažení statických dat z API-Football.
 * Spustí se lokálně jednou, výsledné JSON soubory se commitnou do gitu.
 * Vercel pak soubory servíruje ze /public/data/ jako statické assety.
 *
 * Použití: node scripts/fetch-data.mjs
 * Vyžaduje: API_FOOTBALL_KEY nastaven v .env.local
 *
 * Počet API calls: 1 (týmy) + 1 (zápasy) + 48 (soupisky) = ~50 calls
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data");
const BASE = "https://v3.football.api-sports.io";
const LEAGUE = 1;
const SEASON = 2026;

// Načte proměnné z .env.local (jednoduchý parser)
async function loadEnv() {
  const raw = await readFile(path.join(ROOT, ".env.local"), "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && value) process.env[key] = value;
  }
}

async function apiFetch(endpoint) {
  const key = process.env.API_FOOTBALL_KEY;
  const url = `${BASE}${endpoint}`;
  const res = await fetch(url, { headers: { "x-apisports-key": key } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status} for ${endpoint}: ${text}`);
  }
  const json = await res.json();
  // API vrací {response: [...], errors: {...}, results: N}
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API errors: ${JSON.stringify(json.errors)}`);
  }
  return json.response;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  await loadEnv();

  const key = process.env.API_FOOTBALL_KEY;
  if (!key || key === "sem_vloz_svuj_klic") {
    console.error("❌ API_FOOTBALL_KEY není nastaven v .env.local");
    console.error("   Vlož svůj klíč z https://dashboard.api-football.com/");
    process.exit(1);
  }

  await mkdir(DATA_DIR, { recursive: true });
  console.log(`📁 Data se uloží do: ${DATA_DIR}\n`);

  // ── 1. Týmy (1 call) ──────────────────────────────────────────────────────
  console.log("📡 [1/3] Stahuji týmy...");
  const teams = await apiFetch(`/teams?league=${LEAGUE}&season=${SEASON}`);
  await writeFile(path.join(DATA_DIR, "teams.json"), JSON.stringify(teams, null, 2));
  console.log(`✅ ${teams.length} týmů uloženo → public/data/teams.json`);

  if (teams.length === 0) {
    console.warn("⚠️  API vrátilo 0 týmů. Zkontroluj, zda je liga/sezóna správná.");
    process.exit(1);
  }

  // ── 2. Zápasy – celý turnaj (1 call) ─────────────────────────────────────
  console.log("\n📡 [2/3] Stahuji rozpis zápasů...");
  const fixtures = await apiFetch(`/fixtures?league=${LEAGUE}&season=${SEASON}`);
  await writeFile(path.join(DATA_DIR, "fixtures.json"), JSON.stringify(fixtures, null, 2));
  console.log(`✅ ${fixtures.length} zápasů uloženo → public/data/fixtures.json`);

  // ── 3. Soupisky – jeden call na tým (48 calls) ────────────────────────────
  console.log(`\n📡 [3/3] Stahuji soupisky (${teams.length} týmů, ~${teams.length * 0.3}s)...`);
  const squads = {};
  let done = 0;
  let failed = [];

  for (const t of teams) {
    const teamId = t.team.id;
    try {
      const resp = await apiFetch(`/players/squads?team=${teamId}`);
      // Odpověď: [{team: {...}, players: [...]}]
      squads[teamId] = resp[0] ?? { team: t.team, players: [] };
    } catch (err) {
      console.warn(`\n  ⚠️  Soupiska pro ${t.team.name} (${teamId}) selhala: ${err.message}`);
      squads[teamId] = { team: t.team, players: [] };
      failed.push(t.team.name);
    }
    done++;
    process.stdout.write(`\r  ${done}/${teams.length} soupisek staženo...`);
    // 300ms pauza – chráníme se před rate limitem
    await sleep(300);
  }

  process.stdout.write("\n");
  await writeFile(path.join(DATA_DIR, "squads.json"), JSON.stringify(squads, null, 2));
  console.log(`✅ Soupisky uloženy → public/data/squads.json`);

  if (failed.length > 0) {
    console.warn(`\n⚠️  Soupisky se nepodařilo stáhnout pro: ${failed.join(", ")}`);
  }

  // ── Hotovo ────────────────────────────────────────────────────────────────
  console.log("\n🎉 Hotovo! Soubory jsou připraveny.");
  console.log("\nDalší kroky:");
  console.log("  1. Zkontroluj soubory v public/data/");
  console.log("  2. git add public/data/");
  console.log('  3. git commit -m "feat: add static WC 2026 data"');
  console.log("  4. git push → Vercel deploy\n");
}

main().catch((err) => {
  console.error("\n❌ Script selhal:", err.message);
  process.exit(1);
});
