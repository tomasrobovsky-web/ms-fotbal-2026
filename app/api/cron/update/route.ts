import { NextResponse } from "next/server";
import {
  fetchFixturesByDate,
  fetchStandings,
  fetchTopScorers,
  fetchTopAssists,
} from "@/lib/api-football";
import { kvSet, KV_KEYS } from "@/lib/kv";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // Stáhneme zápasy pro dnešek a včerejšek (2 dotazy)
    const [todayFixtures, yesterdayFixtures, standings, scorers, assists] =
      await Promise.all([
        fetchFixturesByDate(today),
        fetchFixturesByDate(yesterday),
        fetchStandings(),
        fetchTopScorers(),
        fetchTopAssists(),
      ]);

    // Uložíme do KV
    await Promise.all([
      kvSet(KV_KEYS.fixtures(today), todayFixtures),
      kvSet(KV_KEYS.fixtures(yesterday), yesterdayFixtures),
      kvSet(KV_KEYS.standings, standings),
      kvSet(KV_KEYS.topScorers, scorers),
      kvSet(KV_KEYS.topAssists, assists),
      kvSet(KV_KEYS.lastUpdate, new Date().toISOString()),
    ]);

    return NextResponse.json({
      ok: true,
      updated: new Date().toISOString(),
      todayFixtures: todayFixtures.length,
      yesterdayFixtures: yesterdayFixtures.length,
    });
  } catch (error) {
    console.error("Cron update selhal:", error);
    return NextResponse.json({ error: "Update selhal" }, { status: 500 });
  }
}
