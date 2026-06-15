'use strict';
/**
 * Jednorázový inicializační script.
 * Spuštění: node scripts/init-data.js
 *           npm run init-data
 */

const { fetchSeasonEvents, fetchStandings, fetchSquad } = require('./lib/api');
const { writeJSON, updateMeta }                         = require('./lib/store');
const { transformEvent, transformStanding, transformPlayer } = require('./lib/transform');

const SQUAD_DELAY_MS = 1200; // pauza mezi soupisky — 30 req/min = max 1 req/2s

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function groupBy(arr, fn) {
  return arr.reduce((acc, x) => {
    const k = fn(x);
    (acc[k] = acc[k] ?? []).push(x);
    return acc;
  }, {});
}

// lookup_all_teams.php?id=4429 vrací špatnou ligu — týmy derivujeme přímo
// z rozpisových dat, kde jsou správné idHomeTeam/idAwayTeam pro MS týmy.
function extractTeamsFromSchedule(schedule) {
  const map = new Map();
  for (const m of schedule) {
    if (m.homeTeamId && !map.has(m.homeTeamId)) {
      map.set(m.homeTeamId, { id: m.homeTeamId, name: m.homeTeam,  logo: m.homeLogo ?? null });
    }
    if (m.awayTeamId && !map.has(m.awayTeamId)) {
      map.set(m.awayTeamId, { id: m.awayTeamId, name: m.awayTeam, logo: m.awayLogo ?? null });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   MS Fotbal 2026 — Init Data             ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // ── 1. Rozpis + týmy (týmy derivujeme ze zápasů, ne z lookup_all_teams) ───
  process.stdout.write('📥 Zápasy...        ');
  const rawEvents = await fetchSeasonEvents();
  const schedule = rawEvents.map(transformEvent);
  writeJSON('schedule.json', schedule);

  const byDate = groupBy(schedule, m => m.date);
  const days = Object.keys(byDate).sort();
  const range = days.length > 0 ? `${days[0]} → ${days[days.length - 1]}` : '—';
  console.log(`✅  ${schedule.length} zápasů (${days.length} dní: ${range})  →  public/data/schedule.json`);
  if (schedule.length < 104) {
    console.log(`   ⚠️  API má zatím ${schedule.length}/104 zápasů — doplní se postupně přes update worker`);
  }

  // Týmy ze zápasů (správné MS reprezentace)
  process.stdout.write('📥 Týmy...          ');
  const teams = extractTeamsFromSchedule(schedule);
  writeJSON('teams.json', teams);
  console.log(`✅  ${teams.length} týmů  →  public/data/teams.json`);

  // ── 3. Tabulky ─────────────────────────────────────────────────────────────
  process.stdout.write('📥 Tabulky...       ');
  const rawStandings = await fetchStandings();
  const standings = rawStandings.map(transformStanding);
  writeJSON('standings.json', standings);
  console.log(`✅  ${standings.length} řádků  →  public/data/standings.json`);

  // ── 4. Soupisky (1 request / tým) ─────────────────────────────────────────
  console.log(`\n📥 Soupisky (${teams.length} týmů, ~${Math.round(teams.length * SQUAD_DELAY_MS / 1000)}s)...`);
  const squads = {};
  let done = 0, empty = 0, failed = 0;

  for (const team of teams) {
    try {
      const rawPlayers = await fetchSquad(team.id);
      squads[team.id] = rawPlayers.map(transformPlayer);
      if (squads[team.id].length === 0) empty++;
    } catch (err) {
      console.warn(`\n   ⚠️  Soupiska ${team.name}: ${err.message}`);
      squads[team.id] = [];
      failed++;
    }

    done++;
    const bar = '█'.repeat(Math.round(done / teams.length * 20)).padEnd(20, '░');
    process.stdout.write(`\r  [${bar}] ${done}/${teams.length} — ${team.name.padEnd(25)}`);

    // Pauza každých 20 soupisek — rozdělíme 48 teamů do 3 rate-limit oken.
    // fetchSeasonEvents spotřebuje 4 requesty → první okno: 4 + 20 = 24 req.
    if (done % 20 === 0 && done < teams.length) {
      process.stdout.write(`\n  ⏳ Pauza 65s (reset rate limit okna ${Math.floor(done / 20) + 1}/3)...\n`);
      await sleep(65_000);
    } else {
      await sleep(SQUAD_DELAY_MS);
    }
  }

  process.stdout.write('\n');
  writeJSON('squads.json', squads);
  console.log(`✅  Soupisky  →  public/data/squads.json`);
  if (empty > 0)  console.log(`   ℹ️  ${empty} týmů bez hráčů (API je ještě nemá)`);
  if (failed > 0) console.log(`   ⚠️  ${failed} soupisek selhalo`);

  // ── Meta ───────────────────────────────────────────────────────────────────
  updateMeta({
    lastInit:       new Date().toISOString(),
    teamsCount:     teams.length,
    matchesCount:   schedule.length,
    standingsCount: standings.length,
    squadsCount:    Object.keys(squads).length,
  });

  // ── Shrnutí ────────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   Hotovo!                                ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  teams.json     ${String(teams.length).padStart(4)} týmů`);
  console.log(`  schedule.json  ${String(schedule.length).padStart(4)} zápasů`);
  console.log(`  standings.json ${String(standings.length).padStart(4)} řádků`);
  console.log(`  squads.json    ${String(Object.keys(squads).length).padStart(4)} týmů\n`);
}

main().catch(err => {
  console.error('\n❌ Init selhal:', err.message);
  process.exit(1);
});
