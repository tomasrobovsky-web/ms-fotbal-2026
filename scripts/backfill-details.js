'use strict';
/**
 * Backfill detailů zápasů — pro každý odehraný/živý zápas stáhne timeline,
 * sestavy a statistiky a uloží do public/data/matches/<id>.json.
 *
 * Zdroj: TheSportsDB. Free klíč (123) ořezává detaily na 5 položek; premium klíč
 * (THESPORTSDB_KEY v .env.local / prostředí) odemkne plná data přes v2 — pak
 * stačí smazat public/data/matches a spustit znovu pro plné sestavy/statistiky.
 *
 * Přírůstkově: dohrané zápasy s existujícím souborem přeskočí; živé vždy obnoví.
 *
 * Spuštění:  node scripts/backfill-details.js
 *            npm run backfill
 */

const fs = require('fs');
const path = require('path');

const { loadEnv } = require('./lib/env');
loadEnv();

const { fetchTimeline, fetchLineup, fetchStats, IS_PREMIUM } = require('./lib/api');
const { readJSON, updateMeta, DATA_DIR } = require('./lib/store');
const { transformTimeline, transformLineup, transformStats } = require('./lib/transform');

const MATCHES_DIR = path.join(DATA_DIR, 'matches');
const CALL_DELAY_MS = 2100; // free limit = 30 req/min → ~1 request / 2,1 s

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function isFinished(status) {
  const s = String(status || '').toUpperCase();
  return s === 'FT' || s === 'AET' || s === 'PEN' || s === 'AWD' || s === 'WO';
}
function isLive(status) {
  const s = String(status || '').toUpperCase();
  return s !== '' && s !== 'NS' && s !== 'TBD' && s !== 'PST' && !isFinished(status);
}

function writeDetail(id, data) {
  fs.mkdirSync(MATCHES_DIR, { recursive: true });
  const fp = path.join(MATCHES_DIR, `${id}.json`);
  fs.writeFileSync(fp + '.tmp', JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(fp + '.tmp', fp);
}
function detailExists(id) {
  return fs.existsSync(path.join(MATCHES_DIR, `${id}.json`));
}

// Z událostí odvodí, který tým dostal červenou (pro indikátor v UI).
function redsFromEvents(events) {
  const reds = {};
  for (const e of events) {
    if (e.type === 'red') reds[e.team] = true;
  }
  return reds;
}

async function buildDetail(match) {
  const id = match.id;
  // Sekvenčně s rozestupem — chrání před 429 (free limit 30/min).
  const tl = await fetchTimeline(id).catch(() => []);
  await sleep(CALL_DELAY_MS);
  const lu = await fetchLineup(id).catch(() => []);
  await sleep(CALL_DELAY_MS);
  const st = await fetchStats(id).catch(() => []);

  const events = transformTimeline(tl);
  const lineups = transformLineup(lu);
  const stats = transformStats(st);

  const hasLineups = lineups.home.xi.length > 0 || lineups.away.xi.length > 0;
  const hasStats = stats.donuts.length > 0 || stats.bars.length > 0;

  return {
    id,
    events,
    reds: redsFromEvents(events),
    lineups: hasLineups ? lineups : null,
    stats: hasStats ? stats : null,
    source: IS_PREMIUM ? 'thesportsdb-v2' : 'thesportsdb-v1',
    updatedAt: new Date().toISOString(),
  };
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log(`║   MS Fotbal 2026 — Backfill detailů [${IS_PREMIUM ? 'PREMIUM' : 'free   '}]║`);
  console.log('╚══════════════════════════════════════════╝\n');

  const schedule = readJSON('schedule.json') ?? [];
  if (schedule.length === 0) {
    console.warn('⚠️  schedule.json je prázdný — spusť nejdřív: npm run init-data');
    return;
  }

  const targets = schedule.filter((m) => isFinished(m.status) || isLive(m.status));
  console.log(`📋 ${targets.length} odehraných/živých zápasů ke zpracování\n`);

  let fetched = 0, skipped = 0, failed = 0;
  for (const match of targets) {
    const id = match.id;
    const live = isLive(match.status);

    // Dohrané s existujícím souborem přeskočíme (data se už nemění).
    if (!live && detailExists(id)) { skipped++; continue; }

    try {
      const detail = await buildDetail(match);
      const ev = detail.events.length;
      const xi = detail.lineups ? detail.lineups.home.xi.length + detail.lineups.away.xi.length : 0;
      const stt = detail.stats ? detail.stats.donuts.length + detail.stats.bars.length : 0;

      // Nezapisuj úplně prázdný detail (typicky rate-limit) — ať se příště zkusí znovu.
      if (ev === 0 && xi === 0 && stt === 0) {
        failed++;
        console.warn(`  ⚠️  ${(match.name || id).padEnd(34)} prázdné (rate-limit?) — přeskočeno`);
      } else {
        writeDetail(id, detail);
        fetched++;
        console.log(`  ✅ ${(match.name || id).padEnd(34)} události=${ev} sestava=${xi} stat=${stt}${live ? ' (live)' : ''}`);
      }
    } catch (err) {
      failed++;
      console.warn(`  ⚠️  ${match.name || id}: ${err.message}`);
    }
    await sleep(CALL_DELAY_MS);
  }

  updateMeta({
    lastBackfill: new Date().toISOString(),
    detailsCount: fs.existsSync(MATCHES_DIR) ? fs.readdirSync(MATCHES_DIR).filter((f) => f.endsWith('.json')).length : 0,
  });

  console.log(`\n🎉 Hotovo. Staženo ${fetched}, přeskočeno ${skipped}, chyb ${failed}.`);
  if (!IS_PREMIUM) {
    console.log('ℹ️  Free klíč: detaily jsou ořezané na 5 položek. Pro plná data nastav');
    console.log('   THESPORTSDB_KEY (premium) v .env.local, smaž public/data/matches a spusť znovu.');
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('\n❌ Backfill selhal:', err.message);
    process.exit(1);
  });
}

module.exports = { main, buildDetail };
