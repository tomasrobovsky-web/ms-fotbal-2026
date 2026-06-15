import { promises as fs } from "fs";
import path from "path";
import type { MatchEvent, TeamLineups, MatchStats } from "./match-data";

// Tvar souboru public/data/matches/<id>.json (zapisuje scripts/backfill-details.js).
export type MatchDetailFile = {
  id: string;
  events: MatchEvent[];
  reds: { h?: boolean; a?: boolean };
  lineups: TeamLineups | null;
  stats: MatchStats | null;
  source?: string;
  updatedAt?: string;
};

const MATCHES_DIR = path.join(process.cwd(), "public", "data", "matches");
const LIVE_DIR = path.join(process.cwd(), "public", "data", "live");

export async function readMatchDetail(id: string): Promise<MatchDetailFile | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(MATCHES_DIR, `${id}.json`), "utf-8"));
  } catch {
    return null;
  }
}

// Načte všechny detaily najednou (pro seznam zápasů na homepage).
export async function readAllMatchDetails(): Promise<Record<string, MatchDetailFile>> {
  const out: Record<string, MatchDetailFile> = {};
  let files: string[];
  try {
    files = await fs.readdir(MATCHES_DIR);
  } catch {
    return out;
  }
  await Promise.all(
    files.filter((f) => f.endsWith(".json")).map(async (f) => {
      try {
        out[f.replace(/\.json$/, "")] = JSON.parse(await fs.readFile(path.join(MATCHES_DIR, f), "utf-8"));
      } catch {
        /* ignoruj poškozený soubor */
      }
    })
  );
  return out;
}

// Aktuální minuta živého zápasu z public/data/live/<id>.json (zapisuje worker).
export async function readLiveMinute(id: string): Promise<number | undefined> {
  try {
    const live = JSON.parse(await fs.readFile(path.join(LIVE_DIR, `${id}.json`), "utf-8"));
    const m = parseInt(live?.minute, 10);
    return Number.isFinite(m) ? m : undefined;
  } catch {
    return undefined;
  }
}
