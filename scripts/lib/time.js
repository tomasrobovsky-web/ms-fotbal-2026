'use strict';

const PRAGUE_TZ = 'Europe/Prague';

// Match window okna (milisekundy)
const PRE_MATCH_MS  = 75 * 60 * 1000;   // 75 min před výkopem (hledáme sestavy)
const MATCH_PLAY_MS = 105 * 60 * 1000;  // 90 min hra + 15 min přestávka
const POST_MATCH_MS = 60 * 60 * 1000;   // 60 min po skončení (prodloužení + zápis gólů)

// Převod TheSportsDB dateEvent + strTime (UTC) → UTC ms
function toUtcMs(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const time = timeStr.length >= 8 ? timeStr.slice(0, 8) : timeStr.padEnd(8, '0').slice(0, 8);
  const ts = new Date(`${dateStr}T${time}Z`).getTime();
  return isNaN(ts) ? null : ts;
}

const nowMs = () => Date.now();

// Dnešní datum v pražském čase (YYYY-MM-DD)
function todayCEST() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: PRAGUE_TZ });
}

// Formátování UTC timestamp pro výpis logů v SELČ
function fmt(utcMs) {
  if (!utcMs) return '?';
  return new Date(utcMs).toLocaleString('cs-CZ', {
    timeZone: PRAGUE_TZ,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Match window pro daný zápas (vrací start/end v UTC ms)
function matchWindow(kickoffMs) {
  return {
    start: kickoffMs - PRE_MATCH_MS,
    end:   kickoffMs + MATCH_PLAY_MS + POST_MATCH_MS,
  };
}

module.exports = {
  toUtcMs, nowMs, todayCEST, fmt, matchWindow,
  PRE_MATCH_MS, MATCH_PLAY_MS, POST_MATCH_MS,
  PRAGUE_TZ,
};
