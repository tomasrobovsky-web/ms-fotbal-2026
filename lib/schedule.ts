import { promises as fs } from "fs";
import path from "path";
import type { Match, MatchStatus, TeamCode } from "./match-data";
import { NAME_TO_CODE, TEAM_GROUP } from "./match-data";
import { readAllMatchDetails, readLiveMinute, type MatchDetailFile } from "./match-detail";

// Tvar jednoho zápasu v public/data/schedule.json (TheSportsDB).
type RawMatch = {
  id: string;
  name: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: string;
  awayTeamId: string;
  homeLogo: string | null;
  awayLogo: string | null;
  date: string; // "YYYY-MM-DD" (UTC)
  timeUtc: string; // "HH:MM:SS" (UTC)
  venue: string;
  round: number;
  group?: string | null; // "Group A"
  status: string; // "NS" | "FT" | "LIVE" | ...
  homeScore: number | null;
  awayScore: number | null;
};

// "Group A" → "A" (jinak "").
export function groupLetterFrom(g?: string | null): string {
  if (!g) return "";
  const m = g.match(/([A-L])\s*$/i);
  return m ? m[1].toUpperCase() : "";
}

const SCHEDULE_PATH = path.join(process.cwd(), "public", "data", "schedule.json");

// Anglický název týmu -> náš kód. Fallback: první 3 znaky velkými písmeny.
function nameToCode(name: string): TeamCode {
  return (NAME_TO_CODE[name] ?? (name.slice(0, 3).toUpperCase() as TeamCode));
}

// "NS" -> upcoming, "FT/AET/PEN" -> finished, jinak (běžící zápas) -> live.
function mapStatus(raw: string): MatchStatus {
  const s = raw.toUpperCase();
  if (s === "NS" || s === "TBD" || s === "PST" || s === "") return "upcoming";
  if (s === "FT" || s === "AET" || s === "PEN" || s === "AWD" || s === "WO") return "finished";
  return "live";
}

// UTC datum+čas -> pražský den a čas. Zápas ve 02:00 UTC může v Praze spadnout na jiný den,
// proto se grupování řídí podle vrácené `date` (pražské), ne podle raw.date.
function toPrague(date: string, timeUtc: string): { date: string; kickoff: string } {
  const dt = new Date(`${date}T${timeUtc}Z`);
  if (Number.isNaN(dt.getTime())) return { date, kickoff: timeUtc.slice(0, 5) };
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Prague",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(dt);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    kickoff: `${hour}:${get("minute")}`,
  };
}

// TV vysílatel: zápasy ČR na ČT sport, ostatní (živé/budoucí) na Nova Action.
function tvFor(home: TeamCode, away: TeamCode, status: MatchStatus): Match["tv"] {
  if (home === "CZE" || away === "CZE") return "ct_sport";
  if (status !== "finished") return "nova_action";
  return undefined;
}

function toMatch(raw: RawMatch, detail?: MatchDetailFile, liveMinute?: number): Match {
  const { date, kickoff } = toPrague(raw.date, raw.timeUtc);
  const home = nameToCode(raw.homeTeam);
  const away = nameToCode(raw.awayTeam);
  const status = mapStatus(raw.status);
  return {
    id: String(raw.id),
    date,
    kickoff,
    group: groupLetterFrom(raw.group) || TEAM_GROUP[home] || "",
    stadium: raw.venue ?? "",
    city: "",
    status,
    minute: status === "live" ? liveMinute : undefined,
    home,
    away,
    score: { h: raw.homeScore, a: raw.awayScore },
    reds: detail?.reds ?? {},
    highlights: false,
    tv: tvFor(home, away, status),
    events: detail?.events ?? [],
    lineups: detail?.lineups ?? null,
    stats: detail?.stats ?? null,
  };
}

// Načte a převede všechny zápasy (rozpis + detaily). Čte se za běhu, takže po
// `npm run init-data` / `npm run backfill` stačí refresh stránky (bez rebuildu).
export async function getMatches(): Promise<Match[]> {
  let rows: RawMatch[];
  try {
    const json = await fs.readFile(SCHEDULE_PATH, "utf-8");
    rows = JSON.parse(json) as RawMatch[];
  } catch {
    return [];
  }

  const details = await readAllMatchDetails();

  const matches = await Promise.all(
    rows.map(async (raw) => {
      const id = String(raw.id);
      const detail = details[id];
      const liveMinute =
        mapStatus(raw.status) === "live" ? await readLiveMinute(id) : undefined;
      return toMatch(raw, detail, liveMinute);
    })
  );

  return matches.sort((a, b) =>
    a.date === b.date ? a.kickoff.localeCompare(b.kickoff) : (a.date ?? "").localeCompare(b.date ?? "")
  );
}

// Jeden zápas podle id (pro detail / deep-link na /zapas/[id]).
export async function getMatchById(id: string): Promise<Match | null> {
  const all = await getMatches();
  return all.find((m) => m.id === id) ?? null;
}
