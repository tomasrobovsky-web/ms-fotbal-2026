// Resolvery sestav a statistik z reálných dat (TheSportsDB). Když reálná data
// chybí nebo jsou neúplná, vrací se null → UI ukáže placeholder. Žádná cvičná
// data se už nepoužívají (sestavy budoucích zápasů nesmí být vymyšlené).

import type { PlayerPos, Lineup, TeamLineups, MatchStats, Match } from "./match-data";

export const POS: Record<PlayerPos, { label: string; color: string }> = {
  GK: { label: "Brankář", color: "#f5b933" },
  DF: { label: "Obránce", color: "#38bdf8" },
  MF: { label: "Záložník", color: "#34d399" },
  FW: { label: "Útočník", color: "#fb7185" },
};

function lineupComplete(l?: Lineup | null): boolean {
  return !!l && l.xi.length >= 11;
}

/** Sestavy obou týmů z reálných dat; neúplné/chybějící → null (placeholder). */
export function resolveLineups(match: Match): TeamLineups | null {
  const real = match.lineups ?? null;
  const pick = (side: "home" | "away"): Lineup | null => {
    const realSide = real?.[side];
    if (lineupComplete(realSide)) return realSide!;
    return realSide && realSide.xi.length > 0 ? realSide : null;
  };
  const home = pick("home");
  const away = pick("away");
  if (!home && !away) return null;
  return {
    home: home ?? { form: "", xi: [], bench: [] },
    away: away ?? { form: "", xi: [], bench: [] },
  };
}

function statsCount(s?: MatchStats | null): number {
  return s ? s.donuts.length + s.bars.length : 0;
}

/** Statistiky z reálných dat; když chybí → null (placeholder). */
export function resolveStats(match: Match): MatchStats | null {
  const real = match.stats ?? null;
  return statsCount(real) > 0 ? real : null;
}
