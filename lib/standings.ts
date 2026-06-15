import { promises as fs } from "fs";
import path from "path";
import type { GroupData, StandingRow, TeamCode } from "./match-data";
import { NAME_TO_CODE, ALL_GROUPS } from "./match-data";
import { groupLetterFrom } from "./schedule";

// Tabulky počítáme přímo z rozpisu (public/data/schedule.json) — má skupinu i
// výsledky u každého zápasu, takže nejsme omezení capem 5 u lookuptable.php.
// Fallback na statické ALL_GROUPS, když rozpis chybí / nemá skupiny.

type RawMatch = {
  homeTeam: string;
  awayTeam: string;
  group?: string | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
};

const SCHEDULE_PATH = path.join(process.cwd(), "public", "data", "schedule.json");

function codeFor(name: string): TeamCode {
  return NAME_TO_CODE[name] ?? (name.slice(0, 3).toUpperCase() as TeamCode);
}

function isFinished(status: string): boolean {
  const s = (status || "").toUpperCase();
  return s === "FT" || s === "AET" || s === "PEN" || s === "AWD" || s === "WO";
}

function emptyRow(code: TeamCode): StandingRow {
  return { code, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
}

function sortRows(a: StandingRow, b: StandingRow): number {
  if (b.pts !== a.pts) return b.pts - a.pts;
  const gd = (b.gf - b.ga) - (a.gf - a.ga);
  if (gd !== 0) return gd;
  return b.gf - a.gf;
}

function computeGroups(rows: RawMatch[]): GroupData[] {
  // skupina -> kód -> řádek
  const groups = new Map<string, Map<TeamCode, StandingRow>>();

  const ensure = (letter: string, code: TeamCode) => {
    if (!groups.has(letter)) groups.set(letter, new Map());
    const g = groups.get(letter)!;
    if (!g.has(code)) g.set(code, emptyRow(code));
    return g.get(code)!;
  };

  for (const m of rows) {
    const letter = groupLetterFrom(m.group);
    if (!letter) continue;
    const home = codeFor(m.homeTeam);
    const away = codeFor(m.awayTeam);
    const hr = ensure(letter, home);
    const ar = ensure(letter, away);

    if (!isFinished(m.status) || m.homeScore == null || m.awayScore == null) continue;

    const hs = m.homeScore, as = m.awayScore;
    hr.p++; ar.p++;
    hr.gf += hs; hr.ga += as;
    ar.gf += as; ar.ga += hs;
    if (hs > as) { hr.w++; hr.pts += 3; ar.l++; }
    else if (hs < as) { ar.w++; ar.pts += 3; hr.l++; }
    else { hr.d++; ar.d++; hr.pts++; ar.pts++; }
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, m]) => ({ group, rows: Array.from(m.values()).sort(sortRows) }));
}

async function readSchedule(): Promise<RawMatch[] | null> {
  try {
    const rows = JSON.parse(await fs.readFile(SCHEDULE_PATH, "utf-8")) as RawMatch[];
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}

// Reálné tabulky seskupené dle skupin. Fallback na statické ALL_GROUPS.
export async function getGroups(): Promise<GroupData[]> {
  const rows = await readSchedule();
  if (!rows || rows.length === 0) return ALL_GROUPS;
  const groups = computeGroups(rows);
  // Potřebujeme rozumné pokrytí (12 skupin po 4). Jinak fallback na ukázku.
  if (groups.length < 12) return ALL_GROUPS;
  return groups;
}

// Pořadí jedné skupiny (pro „dopad na skupinu" v detailu).
export async function getGroup(letter: string): Promise<StandingRow[] | null> {
  const groups = await getGroups();
  return groups.find((g) => g.group === letter)?.rows ?? null;
}

// Nejlepší týmy z třetích míst (8 postupuje).
export async function getThirdPlaces(): Promise<(StandingRow & { group: string })[]> {
  const groups = await getGroups();
  return groups
    .map((g) => (g.rows[2] ? { ...g.rows[2], group: g.group } : null))
    .filter((x): x is StandingRow & { group: string } => x !== null)
    .sort(sortRows);
}
