'use strict';

const { safe } = require('./api');

// Zápas ze seznamu (schedule)
function transformEvent(raw) {
  const homeScore = raw.intHomeScore != null && raw.intHomeScore !== '' ? parseInt(raw.intHomeScore) : null;
  const awayScore = raw.intAwayScore != null && raw.intAwayScore !== '' ? parseInt(raw.intAwayScore) : null;

  return {
    id:          raw.idEvent,
    name:        raw.strEvent,
    homeTeam:    raw.strHomeTeam,
    awayTeam:    raw.strAwayTeam,
    homeTeamId:  safe(raw, 'idHomeTeam'),
    awayTeamId:  safe(raw, 'idAwayTeam'),
    homeLogo:    safe(raw, 'strHomeTeamBadge'),
    awayLogo:    safe(raw, 'strAwayTeamBadge'),
    group:       safe(raw, 'strGroup'),
    date:        raw.dateEvent,
    timeUtc:     raw.strTime,
    venue:       safe(raw, 'strVenue'),
    round:       raw.intRound != null ? parseInt(raw.intRound) : null,
    status:      raw.strStatus ?? 'NS',
    homeScore,
    awayScore,
  };
}

// Tým
function transformTeam(raw) {
  return {
    id:            raw.idTeam,
    name:          raw.strTeam,
    shortName:     safe(raw, 'strTeamShort'),
    logo:          safe(raw, 'strTeamBadge'),
    stadium:       safe(raw, 'strStadium'),
    country:       safe(raw, 'strCountry'),
    idAPIfootball: safe(raw, 'idAPIfootball'),
  };
}

// Řádek tabulky
function transformStanding(raw) {
  return {
    rank:         parseInt(raw.intRank ?? 0),
    teamId:       raw.idTeam,
    team:         raw.strTeam,
    group:        safe(raw, 'strGroup'),
    badge:        raw.strBadge,
    description:  safe(raw, 'strDescription'),
    played:       parseInt(raw.intPlayed ?? 0),
    won:          parseInt(raw.intWin ?? 0),
    drawn:        parseInt(raw.intDraw ?? 0),
    lost:         parseInt(raw.intLoss ?? 0),
    goalsFor:     parseInt(raw.intGoalsFor ?? 0),
    goalsAgainst: parseInt(raw.intGoalsAgainst ?? 0),
    goalDiff:     parseInt(raw.intGoalDifference ?? 0),
    points:       parseInt(raw.intPoints ?? 0),
    form:         safe(raw, 'strForm', ''),
    updatedAt:    raw.dateUpdated ?? null,
  };
}

// Hráč v soupisce
function transformPlayer(raw) {
  return {
    id:          raw.idPlayer,
    name:        raw.strPlayer,
    position:    safe(raw, 'strPosition'),
    nationality: safe(raw, 'strNationality'),
    born:        safe(raw, 'dateBorn'),
    photo:       safe(raw, 'strThumb') ?? safe(raw, 'strCutout'),
    number:      safe(raw, 'strNumber'),
  };
}

// Live detail zápasu (volaný během match window)
function transformLiveEvent(raw) {
  if (!raw) return null;

  const homeScore = raw.intHomeScore != null && raw.intHomeScore !== '' ? parseInt(raw.intHomeScore) : null;
  const awayScore = raw.intAwayScore != null && raw.intAwayScore !== '' ? parseInt(raw.intAwayScore) : null;

  return {
    id:              raw.idEvent,
    homeTeam:        raw.strHomeTeam,
    awayTeam:        raw.strAwayTeam,
    homeScore,
    awayScore,
    status:          raw.strStatus ?? 'NS',
    minute:          safe(raw, 'intTimer', null),
    homeFormation:   safe(raw, 'strHomeFormation'),
    awayFormation:   safe(raw, 'strAwayFormation'),
    homeLineup:      safe(raw, 'strLineup_H'),
    awayLineup:      safe(raw, 'strLineup_A'),
    homeSquad:       safe(raw, 'strSquad_H'),
    awaySquad:       safe(raw, 'strSquad_A'),
    homeGoalDetails: safe(raw, 'strHomeGoalDetails'),
    awayGoalDetails: safe(raw, 'strAwayGoalDetails'),
    updatedAt:       new Date().toISOString(),
  };
}

// ── Detail zápasu: timeline → události ───────────────────────────────────────

function toMin(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}

// Jeden řádek timeline → událost v UI tvaru, nebo null (neznámý typ).
function transformTimelineRow(raw) {
  const team = (raw.strHome === 'Yes' || raw.intHome === 1) ? 'h' : 'a';
  const minute = toMin(raw.intTime);
  const kind = (raw.strTimeline || '').toLowerCase();
  const detail = (raw.strTimelineDetail || '').toLowerCase();
  const player = safe(raw, 'strPlayer', '') || '';
  const assist = safe(raw, 'strAssist', '') || '';

  if (kind === 'goal' || detail.includes('goal')) {
    return { minute, type: 'goal', team, player, assist };
  }
  if (kind === 'card' || detail.includes('card')) {
    const type = detail.includes('red') ? 'red' : 'yellow';
    return { minute, type, team, player };
  }
  if (kind === 'subst' || kind === 'substitution' || detail.includes('subst')) {
    // TheSportsDB: strPlayer = příchozí, strAssist = odcházející (přibližně).
    return { minute, type: 'sub', team, player, off: assist };
  }
  return null;
}

function transformTimeline(rows) {
  return (rows || [])
    .map(transformTimelineRow)
    .filter(Boolean)
    .sort((a, b) => a.minute - b.minute);
}

// ── Detail zápasu: lineup → sestavy ──────────────────────────────────────────

// strPosition (např. "Centre-Forward", "Defensive Midfield") → skupina GK/DF/MF/FW.
function positionGroup(strPosition) {
  const p = (strPosition || '').toLowerCase();
  if (/goalkeeper|keeper|\bgk\b/.test(p)) return 'GK';
  if (/back|defen/.test(p)) return 'DF';
  if (/midfield|\bdm\b|\bcm\b|\bam\b/.test(p)) return 'MF';
  if (/forward|wing|strik|attack|str\b/.test(p)) return 'FW';
  return 'MF';
}

// Odvození formace z pozic základní jedenáctky (bez GK), např. "4-3-3".
function deriveFormation(xi) {
  const counts = { DF: 0, MF: 0, FW: 0 };
  for (const p of xi) {
    if (p.pos === 'DF' || p.pos === 'MF' || p.pos === 'FW') counts[p.pos]++;
  }
  const parts = [counts.DF, counts.MF, counts.FW].filter((n) => n > 0);
  return parts.length >= 2 ? parts.join('-') : '';
}

function lineupRowToPlayer(raw) {
  return {
    name: safe(raw, 'strPlayer', '') || '',
    num: raw.intSquadNumber != null && raw.intSquadNumber !== '' ? parseInt(raw.intSquadNumber, 10) : null,
    pos: positionGroup(safe(raw, 'strPosition', '')),
    club: safe(raw, 'strTeam', '') || '',
  };
}

// Vrací { home: { form, xi, bench }, away: {...} }.
function transformLineup(rows) {
  const sideOf = (raw) => (raw.strHome === 'Yes' || raw.intHome === 1 ? 'home' : 'away');
  const out = {
    home: { form: '', xi: [], bench: [] },
    away: { form: '', xi: [], bench: [] },
  };
  for (const raw of rows || []) {
    const side = sideOf(raw);
    const isSub = raw.strSubstitute === 'Yes' || raw.strSubstitute === '1';
    const player = lineupRowToPlayer(raw);
    if (!player.name) continue;
    if (isSub) out[side].bench.push({ name: player.name, pos: player.pos, club: player.club });
    else out[side].xi.push(player);
  }
  out.home.form = deriveFormation(out.home.xi);
  out.away.form = deriveFormation(out.away.xi);
  return out;
}

// ── Detail zápasu: eventstats → statistiky (donuts + bars) ───────────────────

function toStatNum(v) {
  if (v == null) return 0;
  const n = parseFloat(String(v).replace('%', '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

// strStat (anglicky) → { label (CZ), group: 'donut'|'bar', order }.
const STAT_MAP = {
  'expected_goals': { label: 'xG', group: 'donut', order: 0 },
  'Expected Goals': { label: 'xG', group: 'donut', order: 0 },
  'Ball Possession': { label: 'Držení %', group: 'donut', order: 1 },
  'Shots on Goal': { label: 'Na branku', group: 'donut', order: 2 },
  'Passes %': { label: 'Přesnost %', group: 'donut', order: 3 },
  'Passes Accurate': { label: 'Přesné přihr.', group: 'bar', order: 13 },
  'Corner Kicks': { label: 'Rohy', group: 'donut', order: 4 },
  'Fouls': { label: 'Fauly', group: 'donut', order: 5 },
  'Total Shots': { label: 'Střely celkem', group: 'bar', order: 6 },
  'Shots off Goal': { label: 'Střely mimo', group: 'bar', order: 7 },
  'Blocked Shots': { label: 'Zblokované', group: 'bar', order: 8 },
  'Shots insidebox': { label: 'Střely ve vápně', group: 'bar', order: 9 },
  'Shots outsidebox': { label: 'Střely zvenku', group: 'bar', order: 10 },
  'Total passes': { label: 'Přihrávky', group: 'bar', order: 11 },
  'Offsides': { label: 'Ofsajdy', group: 'bar', order: 12 },
  'Goalkeeper Saves': { label: 'Zákroky brankáře', group: 'bar', order: 14 },
  'Yellow Cards': { label: 'Žluté karty', group: 'bar', order: 15 },
  'Red Cards': { label: 'Červené karty', group: 'bar', order: 16 },
};

function transformStats(rows) {
  const donuts = [];
  const bars = [];
  for (const raw of rows || []) {
    const meta = STAT_MAP[raw.strStat];
    if (!meta) continue;
    const h = toStatNum(raw.intHome);
    const a = toStatNum(raw.intAway);
    const entry = [meta.label, h, a, meta.order];
    (meta.group === 'donut' ? donuts : bars).push(entry);
  }
  const byOrder = (x, y) => x[3] - y[3];
  return {
    donuts: donuts.sort(byOrder).map(([l, h, a]) => [l, h, a]),
    bars: bars.sort(byOrder).map(([l, h, a]) => [l, h, a]),
  };
}

module.exports = {
  transformEvent,
  transformTeam,
  transformStanding,
  transformPlayer,
  transformLiveEvent,
  transformTimeline,
  transformLineup,
  transformStats,
  positionGroup,
  deriveFormation,
};
