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

const { fetchTimeline, fetchLineup, fetchStats, fetchTeam, IS_PREMIUM } = require('./lib/api');
const { readJSON, writeJSON, updateMeta, DATA_DIR } = require('./lib/store');
const { transformTimeline, transformLineup, transformStats } = require('./lib/transform');

const MATCHES_DIR = path.join(DATA_DIR, 'matches');
const CALL_DELAY_MS = 700; // premium limit = 100 req/min → ~1 request / 0,7 s
const CLUBS_FILE = 'clubs.json'; // cache log klubů: { [idTeam]: { name, logo } }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Cache log klubů ──────────────────────────────────────────────────────────
// Logo klubu není v sestavě – dohledává se lookupem týmu podle idTeam. Cachujeme
// napříč zápasy (clubs.json), takže každý klub se stáhne jen jednou.
let clubCache = {};
let clubCacheDirty = false;

async function ensureClubLogo(clubId, clubName) {
  if (!clubId) return null;
  if (Object.prototype.hasOwnProperty.call(clubCache, clubId)) {
    return clubCache[clubId]?.logo ?? null;
  }
  let logo = null;
  try {
    const team = await fetchTeam(clubId);
    const b = team && (team.strBadge || team.strTeamBadge);
    logo = (b && b !== 'null' && b !== '') ? b : null;
  } catch { logo = null; }
  clubCache[clubId] = { name: clubName || '', logo };
  clubCacheDirty = true;
  await sleep(CALL_DELAY_MS); // šetři rate-limit jen u nového klubu
  return logo;
}

// Doplní hráčům clubLogo (z cache/lookup) a odstraní dočasné clubId.
async function enrichSide(side) {
  for (const p of [...side.xi, ...side.bench]) {
    p.clubLogo = await ensureClubLogo(p.clubId, p.club);
    delete p.clubId;
  }
}

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
// True, když existující soubor pochází z premium v2 (plná data). Free/ořezané
// soubory se tak při premium běhu přestáhnou místo přeskočení.
function detailIsPremium(id) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(MATCHES_DIR, `${id}.json`), 'utf-8'));
    return d.source === 'thesportsdb-v2';
  } catch { return false; }
}

// Načte existující detail (nebo null).
function readDetail(id) {
  try {
    return JSON.parse(fs.readFileSync(path.join(MATCHES_DIR, `${id}.json`), 'utf-8'));
  } catch { return null; }
}

// ── Posouzení úplnosti detailu ───────────────────────────────────────────────
// Některé zápasy se stáhly hned po skončení, kdy poskytovatel ještě neměl plný
// timeline → uložily se s prázdnými/neúplnými událostmi, ale už s premium
// `source`, takže je stará logika navždy přeskakovala. Detail proto bereme jako
// hotový, jen když pokrývá všechny góly podle skóre a má sestavy i statistiky.
function totalGoals(match) {
  const h = parseInt(match.homeScore, 10);
  const a = parseInt(match.awayScore, 10);
  return (Number.isFinite(h) ? h : 0) + (Number.isFinite(a) ? a : 0);
}
function goalCount(detail) {
  return ((detail && detail.events) || []).filter((e) => e.type === 'goal').length;
}
function hasLineups(detail) {
  const l = detail && detail.lineups;
  return !!l && (((l.home && l.home.xi ? l.home.xi.length : 0) + (l.away && l.away.xi ? l.away.xi.length : 0)) > 0);
}
function hasStats(detail) {
  const s = detail && detail.stats;
  return !!s && (((s.donuts ? s.donuts.length : 0) + (s.bars ? s.bars.length : 0)) > 0);
}
function detailComplete(detail, match) {
  if (!detail) return false;
  if (goalCount(detail) < totalGoals(match)) return false; // chybí střelci gólů
  return hasLineups(detail) && hasStats(detail);
}

// ── Bezpečné sloučení starého a nového detailu ───────────────────────────────
// Re-fetch nikdy nesmí zhoršit data, která už máme (poskytovatel může mít
// dočasný výpadek). Z každé sekce vezmeme tu bohatší variantu.
function statCount(s) {
  return s ? ((s.donuts ? s.donuts.length : 0) + (s.bars ? s.bars.length : 0)) : 0;
}
function mergeDetail(existing, fresh, match) {
  // Události: víc pokrytých gólů (a při shodě delší timeline) vyhrává.
  const eFresh = fresh.events || [];
  const eOld = (existing && existing.events) || [];
  const gFresh = eFresh.filter((e) => e.type === 'goal').length;
  const gOld = eOld.filter((e) => e.type === 'goal').length;
  const events = gFresh !== gOld
    ? (gFresh > gOld ? eFresh : eOld)
    : (eFresh.length >= eOld.length ? eFresh : eOld);

  const lineups = hasLineups(fresh) ? fresh.lineups : (hasLineups(existing) ? existing.lineups : null);
  const stats = statCount(fresh.stats) >= statCount(existing && existing.stats) ? fresh.stats : existing.stats;

  return {
    id: fresh.id,
    events,
    reds: redsFromEvents(events),
    lineups: lineups || null,
    stats: stats || null,
    source: fresh.source,
    updatedAt: fresh.updatedAt,
  };
}
// Shoda obsahu (mimo updatedAt) — ať zbytečně nepřepisujeme soubor (CI churn).
function sameData(a, b) {
  if (!a || !b) return false;
  return JSON.stringify([a.events, a.lineups, a.stats]) === JSON.stringify([b.events, b.lineups, b.stats]);
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

  if (hasLineups) {
    await enrichSide(lineups.home);
    await enrichSide(lineups.away);
  }

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

  clubCache = readJSON(CLUBS_FILE) ?? {};

  const targets = schedule.filter((m) => isFinished(m.status) || isLive(m.status));
  console.log(`📋 ${targets.length} odehraných/živých zápasů ke zpracování\n`);

  let fetched = 0, skipped = 0, failed = 0;
  for (const match of targets) {
    const id = match.id;
    const live = isLive(match.status);

    // Dohraný zápas přeskočíme, jen když:
    //  • free klíč → data se už nezlepší (i kdyby byla ořezaná), neopakuj; nebo
    //  • premium klíč a soubor je už kompletní (v2 + střelci všech gólů + sestavy + staty).
    // Neúplné premium soubory (např. stažené hned po skončení s prázdným timeline)
    // se tak při dalším běhu dotáhnou. Živé vždy obnovujeme.
    const existing = readDetail(id);
    if (!live && existing) {
      const upToDate = !IS_PREMIUM
        ? true
        : (existing.source === 'thesportsdb-v2' && detailComplete(existing, match));
      if (upToDate) { skipped++; continue; }
    }

    try {
      const fresh = await buildDetail(match);
      const detail = existing ? mergeDetail(existing, fresh, match) : fresh;
      const ev = detail.events.length;
      const xi = detail.lineups ? detail.lineups.home.xi.length + detail.lineups.away.xi.length : 0;
      const stt = detail.stats ? detail.stats.donuts.length + detail.stats.bars.length : 0;

      // Nezapisuj úplně prázdný detail (typicky rate-limit) — ať se příště zkusí znovu.
      if (ev === 0 && xi === 0 && stt === 0) {
        failed++;
        console.warn(`  ⚠️  ${(match.name || id).padEnd(34)} prázdné (rate-limit?) — přeskočeno`);
      } else if (existing && sameData(existing, detail)) {
        // Re-fetch nepřinesl nic nového (poskytovatel zatím nemá víc) — nepřepisuj.
        skipped++;
        console.log(`  ⏭️  ${(match.name || id).padEnd(34)} beze změny (čeká na doplnění u zdroje)`);
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

  if (clubCacheDirty) writeJSON(CLUBS_FILE, clubCache);

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
