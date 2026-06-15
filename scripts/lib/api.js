'use strict';

// ── Konfigurace klíče ────────────────────────────────────────────────────────
// Free testovací klíč "123" (v1) vrací data, ALE detailní seznamy (timeline,
// lineup, eventstats) ořezává na 5 položek. Premium klíč (TheSportsDB Patreon)
// odemkne plná data přes v2 API. Stačí nastavit THESPORTSDB_KEY v .env.local /
// prostředí — pipeline pak u detailů zápasu automaticky přepne na v2.
const API_KEY = (process.env.THESPORTSDB_KEY || '123').trim();
const IS_PREMIUM = API_KEY !== '' && API_KEY !== '123';

const V1_BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;
const V2_BASE = 'https://www.thesportsdb.com/api/v2/json';

const LEAGUE_ID = '4429';
const SEASON = '2026';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// TheSportsDB občas vrací string "null" nebo prázdný řetězec místo null
function safe(obj, key, fallback = null) {
  const v = obj?.[key];
  return (v === null || v === undefined || v === 'null' || v === '') ? fallback : v;
}

// ── Nízkoúrovňový fetch ──────────────────────────────────────────────────────
// `premium=true` → v2 endpoint (vyžaduje X-API-KEY header). Jinak v1 (klíč v URL).
// Na 429 čeká 90s a zkusí znovu (víc retryů by spotřebovalo další rate-limit sloty).
async function apiFetch(endpoint, { premium = false, retries = 2 } = {}) {
  const url = premium ? `${V2_BASE}${endpoint}` : `${V1_BASE}${endpoint}`;
  const headers = { 'Accept': 'application/json' };
  if (premium) headers['X-API-KEY'] = API_KEY;
  let lastErr;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) await sleep(1000 * attempt);

      const res = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });

      if (res.status === 429) {
        if (attempt === 0) {
          console.warn(`  [API] 429 rate limit (${endpoint}) — čekám 90s na reset okna...`);
          await sleep(90_000);
          continue;
        }
        throw new Error(`HTTP 429 (rate limit přetrvává po čekání)`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      return await res.json();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        console.warn(`  [API] pokus ${attempt + 1} selhal (${endpoint}): ${err.message}`);
      }
    }
  }

  throw new Error(`API selhalo po ${retries + 1} pokusech pro ${endpoint}: ${lastErr.message}`);
}

// ── Endpointy: rozpis / týmy / tabulky / soupisky (v1, plná data) ────────────

// eventsround.php nemá limit 5 (na rozdíl od detailů) — iterujeme přes kola.
async function fetchSeasonEvents() {
  const all = [];
  for (let round = 1; round <= 20; round++) {
    const d = await apiFetch(`/eventsround.php?id=${LEAGUE_ID}&r=${round}&s=${SEASON}`);
    const events = d?.events ?? [];
    if (events.length === 0) break;
    all.push(...events);
  }
  return all;
}

// POZOR: lookup_all_teams.php?id=4429 vrací týmy jiné ligy. Týmy derivuj ze schedule.
async function fetchTeams() {
  const d = await apiFetch(`/lookup_all_teams.php?id=${LEAGUE_ID}`);
  return d?.teams ?? [];
}

async function fetchStandings() {
  const d = await apiFetch(`/lookuptable.php?l=${LEAGUE_ID}&s=${SEASON}`);
  return d?.table ?? [];
}

async function fetchEventDetail(eventId) {
  const d = await apiFetch(`/lookupevent.php?id=${eventId}`);
  return d?.events?.[0] ?? null;
}

async function fetchSquad(teamId) {
  const d = await apiFetch(`/lookup_all_players.php?id=${teamId}`);
  return d?.player ?? [];
}

// ── Detail zápasu: timeline / lineup / stats ─────────────────────────────────
// Free klíč (v1) → max 5 položek. Premium klíč → v2, plná data. Funkce vrací pole
// záznamů normalizované na shodný tvar bez ohledu na verzi.

function firstArray(obj, keys) {
  for (const k of keys) {
    if (Array.isArray(obj?.[k])) return obj[k];
  }
  return [];
}

async function fetchTimeline(eventId) {
  if (IS_PREMIUM) {
    const d = await apiFetch(`/lookup/event_timeline/${eventId}`, { premium: true });
    return firstArray(d, ['timeline', 'lookup', 'results']);
  }
  const d = await apiFetch(`/lookuptimeline.php?id=${eventId}`);
  return d?.timeline ?? [];
}

async function fetchLineup(eventId) {
  if (IS_PREMIUM) {
    const d = await apiFetch(`/lookup/event_lineup/${eventId}`, { premium: true });
    return firstArray(d, ['lineup', 'lookup', 'results']);
  }
  const d = await apiFetch(`/lookuplineup.php?id=${eventId}`);
  return d?.lineup ?? [];
}

async function fetchStats(eventId) {
  if (IS_PREMIUM) {
    const d = await apiFetch(`/lookup/event_stats/${eventId}`, { premium: true });
    return firstArray(d, ['eventstats', 'lookup', 'results']);
  }
  const d = await apiFetch(`/lookupeventstats.php?id=${eventId}`);
  return d?.eventstats ?? [];
}

module.exports = {
  fetchSeasonEvents,
  fetchTeams,
  fetchStandings,
  fetchEventDetail,
  fetchSquad,
  fetchTimeline,
  fetchLineup,
  fetchStats,
  safe,
  LEAGUE_ID,
  SEASON,
  API_KEY,
  IS_PREMIUM,
};
