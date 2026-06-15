'use strict';
/**
 * Launch refresh — spouští se automaticky před `npm run dev` / `npm run build`
 * (predev/prebuild). Zajistí, že public/data jsou připravená:
 *   - chybí data        → plná inicializace (rozpis, týmy, tabulky, soupisky) + detaily + zprávy
 *   - data zastaralá    → lehký refresh (rozpis, tabulky) + přírůstkové detaily + zprávy
 *   - data čerstvá      → přeskočí (šetří API limit)
 *
 * NIKDY neshodí start aplikace — jakákoliv chyba sítě skončí jen varováním.
 */

const path = require('path');
const { execFileSync } = require('child_process');

const { loadEnv } = require('./lib/env');
loadEnv();

const { readJSON, writeJSON, updateMeta } = require('./lib/store');

const STALE_MS = 30 * 60 * 1000; // 30 min

function run(script) {
  try {
    execFileSync('node', [path.join(__dirname, script)], { stdio: 'inherit' });
  } catch (err) {
    console.warn(`  ⚠️  ${script} skončil chybou (pokračuji): ${err.message}`);
  }
}

async function lightRefresh() {
  const { fetchSeasonEvents, fetchStandings } = require('./lib/api');
  const { transformEvent, transformStanding } = require('./lib/transform');
  try {
    const ev = await fetchSeasonEvents();
    if (ev.length) writeJSON('schedule.json', ev.map(transformEvent));
    const st = await fetchStandings();
    if (st.length) writeJSON('standings.json', st.map(transformStanding));
    updateMeta({ lastInit: new Date().toISOString() });
    console.log(`  ✅ Rozpis (${ev.length}) + tabulky (${st.length}) obnoveny`);
  } catch (err) {
    console.warn(`  ⚠️  Refresh rozpisu/tabulek selhal: ${err.message}`);
  }
}

async function main() {
  console.log('🚀 Launch refresh — kontrola dat...');

  // Na Vercelu (build) data NEREGENERUJEME: build nemá premium klíč, takže by
  // nové zápasy stáhl free klíčem ořezané na 5 položek. Produkční data jsou
  // commitnutá v repu a aktualizuje je GitHub Actions (s premium secretem).
  if (process.env.VERCEL) {
    console.log('▲ Vercel build — přeskakuji refresh, používám commitnutá data.');
    return;
  }

  const schedule = readJSON('schedule.json');
  const meta = readJSON('meta.json') ?? {};
  const last = Date.parse(meta.workerLastTick || meta.lastInit || '') || 0;
  const ageMs = Date.now() - last;

  if (!schedule || schedule.length === 0) {
    console.log('🟡 Data chybí — plná inicializace (může chvíli trvat)...');
    run('init-data.js');
    run('backfill-details.js');
    run('news-sync.js');
    return;
  }

  if (!process.env.FORCE_REFRESH && ageMs > 0 && ageMs < STALE_MS) {
    console.log(`✅ Data jsou čerstvá (před ${Math.round(ageMs / 60000)} min) — refresh přeskočen.`);
    return;
  }

  console.log('🔄 Data zastaralá — lehký refresh...');
  await lightRefresh();
  run('backfill-details.js');
  run('news-sync.js');
}

main()
  .catch((err) => console.warn(`⚠️  Launch refresh: ${err.message}`))
  .finally(() => process.exit(0));
