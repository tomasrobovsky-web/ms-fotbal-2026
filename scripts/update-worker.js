'use strict';
/**
 * Smart Polling Worker — aktualizuje live data během zápasů.
 *
 * Režimy spuštění:
 *   node scripts/update-worker.js              → cron mode (jeden tick, pak exit)
 *   WORKER_MODE=daemon node scripts/update-worker.js  → daemon (běží nepřetržitě)
 *   npm run worker         → cron mode
 *   npm run worker:daemon  → daemon mode
 *
 * Match window pro každý zápas:
 *   [výkop - 75 min]  →  [výkop + 105 min + 60 min]
 *   Polling uvnitř: 1× za minutu
 *   Mimo window:    1× za hodinu (nebo na přesný čas startu dalšího window)
 */

const { fetchSeasonEvents, fetchStandings, fetchEventDetail } = require('./lib/api');
const { readJSON, writeJSON, writeLiveJSON, updateMeta }       = require('./lib/store');
const { toUtcMs, nowMs, todayCEST, fmt, matchWindow }          = require('./lib/time');
const { transformEvent, transformStanding, transformLiveEvent } = require('./lib/transform');
const { syncNews }                                              = require('./news-sync');

const IS_DAEMON = process.env.WORKER_MODE === 'daemon';

const QUIET_INTERVAL_MS = 60 * 60 * 1000;   // 1 hodina
const MATCH_INTERVAL_MS =      60 * 1000;   // 1 minuta
const NEWS_INTERVAL_MS  = 30 * 60 * 1000;   // 30 min — jak často obnovovat zprávy

let nextTickTimer = null;

// ── Hlavní tick ────────────────────────────────────────────────────────────

async function tick() {
  const now = nowMs();
  const todayStr = todayCEST();
  const ts = new Date().toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' });
  console.log(`\n[${ts}] ═══ TICK ═══`);

  // ── Zprávy (nezávisle na zápasech, throttlováno na NEWS_INTERVAL_MS) ────────
  await maybeSyncNews(now);

  // Načteme aktuální rozpis
  const schedule = readJSON('schedule.json') ?? [];
  if (schedule.length === 0) {
    console.warn('  ⚠️  schedule.json je prázdný — spusť nejdřív: npm run init-data');
    return scheduleNextTick(QUIET_INTERVAL_MS);
  }

  const todayMatches = schedule.filter(m => m.date === todayStr);
  console.log(`  📅 ${todayStr}: ${todayMatches.length} zápasů`);

  // Roztřídíme zápasy do tří kategorií
  const active  = [];  // window je právě aktivní
  const pending = [];  // window začne v budoucnu
  const past    = [];  // window už skončilo

  for (const match of todayMatches) {
    const kickoffMs = toUtcMs(match.date, match.timeUtc);
    if (!kickoffMs) continue;

    const w = matchWindow(kickoffMs);

    if (now >= w.start && now <= w.end) {
      active.push({ match, kickoffMs, window: w });
    } else if (now < w.start) {
      pending.push({ match, kickoffMs, window: w, msUntilStart: w.start - now });
    } else {
      past.push({ match, kickoffMs, window: w });
    }
  }

  // ── MATCH MODE (aktivní window) ───────────────────────────────────────────
  if (active.length > 0) {
    console.log(`  🔴 MATCH MODE — ${active.length} aktivní window`);
    for (const { match } of active) {
      const kick = fmt(toUtcMs(match.date, match.timeUtc));
      console.log(`     ↳ ${match.homeTeam} vs ${match.awayTeam} (${kick} SELČ)`);
    }

    await pollLiveMatches(active.map(a => a.match), schedule);
    updateMeta({ workerMode: 'MATCH' });
    return scheduleNextTick(MATCH_INTERVAL_MS);
  }

  // ── DENNÍ ZÁVĚREČNÝ SYNC (po skončení všech oken dne) ────────────────────
  const allDoneToday =
    todayMatches.length > 0 &&
    active.length  === 0 &&
    pending.length === 0;

  if (allDoneToday) {
    const meta = readJSON('meta.json') ?? {};
    if (meta.dailySyncDate !== todayStr) {
      console.log('  🔄 Denní závěrečný sync...');
      await performDailySync(todayStr);
    } else {
      console.log('  ✅ Denní sync pro dnešek již proběhl');
    }
  }

  // ── QUIET MODE ─────────────────────────────────────────────────────────────
  if (pending.length > 0) {
    const nearest = pending.reduce((a, b) => a.msUntilStart < b.msUntilStart ? a : b);
    const minsLeft = Math.ceil(nearest.msUntilStart / 60_000);
    const nextAt   = fmt(nearest.window.start);
    console.log(`  💤 QUIET MODE — nejbližší window za ${minsLeft} min (${nextAt} SELČ)`);
    console.log(`     ↳ ${nearest.match.homeTeam} vs ${nearest.match.awayTeam}`);

    // Neplánujeme zbytečné tisky — přímo na start window (max 1 hodina)
    const delay = Math.min(nearest.msUntilStart, QUIET_INTERVAL_MS);
    updateMeta({ workerMode: 'QUIET' });
    return scheduleNextTick(delay);
  }

  // Klidný den bez zápasů
  console.log('  💤 QUIET MODE — žádné zápasy');
  updateMeta({ workerMode: 'QUIET' });
  return scheduleNextTick(QUIET_INTERVAL_MS);
}

// ── Live polling ────────────────────────────────────────────────────────────

async function pollLiveMatches(matches, schedule) {
  let updated = 0;

  for (const match of matches) {
    try {
      const raw = await fetchEventDetail(match.id);
      if (!raw) {
        console.warn(`  ⚠️  Event detail pro ${match.id} je prázdný`);
        continue;
      }

      const live = transformLiveEvent(raw);
      writeLiveJSON(match.id, live);

      // Aktualizuj skóre a status v schedule (pro denní sync a UI)
      const idx = schedule.findIndex(m => m.id === match.id);
      if (idx !== -1) {
        schedule[idx].homeScore = live.homeScore;
        schedule[idx].awayScore = live.awayScore;
        schedule[idx].status    = live.status;
      }

      const score = live.homeScore !== null
        ? `${live.homeScore}:${live.awayScore}`
        : 'NS';
      const minute = live.minute ? ` ${live.minute}'` : '';
      console.log(`  ⚽  ${match.homeTeam} ${score} ${match.awayTeam}  [${live.status}${minute}]`);
      updated++;
    } catch (err) {
      console.warn(`  ⚠️  Live poll ${match.id} selhal: ${err.message}`);
    }
  }

  if (updated > 0) writeJSON('schedule.json', schedule);
}

// ── Sync zpráv (RSS) ─────────────────────────────────────────────────────────
// Běží při každém ticku, ale fakticky stahuje feedy max 1× za NEWS_INTERVAL_MS —
// nezávisle na tom, zda se hraje zápas (MATCH) nebo je klid (QUIET).

async function maybeSyncNews(now) {
  const meta = readJSON('meta.json') ?? {};
  const lastNews = meta.lastNewsSync ? Date.parse(meta.lastNewsSync) : 0;
  if (now - lastNews < NEWS_INTERVAL_MS) return;

  try {
    const count = await syncNews();
    updateMeta({ lastNewsSync: new Date().toISOString(), newsCount: count });
  } catch (err) {
    console.warn(`  ⚠️  News sync selhal: ${err.message}`);
  }
}

// ── Denní závěrečný sync ────────────────────────────────────────────────────

async function performDailySync(todayStr) {
  try {
    // 1. Tabulky
    process.stdout.write('     📊 Tabulky... ');
    const rawStandings = await fetchStandings();
    if (rawStandings.length > 0) {
      writeJSON('standings.json', rawStandings.map(transformStanding));
      console.log(`✅ ${rawStandings.length} řádků`);
    } else {
      console.log('⚠️  prázdná odpověď');
    }

    // 2. Kompletní sync rozpisu (zachytí nové zápasy přidané do API)
    process.stdout.write('     📅 Rozpis... ');
    const rawEvents = await fetchSeasonEvents();
    if (rawEvents.length > 0) {
      writeJSON('schedule.json', rawEvents.map(transformEvent));
      console.log(`✅ ${rawEvents.length} zápasů`);
    } else {
      console.log('⚠️  API vrátilo 0 zápasů, schedule zůstává beze změny');
    }

    updateMeta({
      dailySyncDate: todayStr,
      lastDailySync: new Date().toISOString(),
    });
    console.log('  ✅ Denní sync dokončen');
  } catch (err) {
    console.error(`  ❌ Denní sync selhal: ${err.message}`);
  }
}

// ── Scheduler ───────────────────────────────────────────────────────────────

function scheduleNextTick(delayMs) {
  if (!IS_DAEMON) {
    const mins = Math.round(delayMs / 60_000);
    console.log(`\n[cron] Hotovo. Spusť znovu za ${mins} min.`);
    process.exit(0);
  }

  const mins   = Math.round(delayMs / 60_000);
  const nextAt = fmt(nowMs() + delayMs);
  console.log(`  ⏰ Příští tick za ${mins} min (${nextAt} SELČ)`);

  if (nextTickTimer) clearTimeout(nextTickTimer);
  nextTickTimer = setTimeout(async () => {
    try {
      await tick();
    } catch (err) {
      console.error('❌ Tick selhal:', err.message);
      scheduleNextTick(QUIET_INTERVAL_MS); // při chybě zkusit za hodinu
    }
  }, delayMs);
}

// ── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const mode = IS_DAEMON ? 'daemon' : 'cron';
  console.log(`╔══════════════════════════════════════════╗`);
  console.log(`║   MS Fotbal 2026 — Update Worker [${mode.padEnd(6)}]║`);
  console.log(`╚══════════════════════════════════════════╝`);

  try {
    await tick();
  } catch (err) {
    console.error('❌ Start tick selhal:', err.message);
    if (IS_DAEMON) scheduleNextTick(QUIET_INTERVAL_MS);
    else process.exit(1);
  }
}

main();
