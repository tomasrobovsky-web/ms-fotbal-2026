import { NextResponse } from "next/server";
import { fetchTeams, fetchFixtures, fetchStandings } from "@/lib/api-football";
import { kvSet, KV_KEYS } from "@/lib/kv";
import { writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Stáhneme vše najednou (3 dotazy)
    const [teams, fixtures, standings] = await Promise.all([
      fetchTeams(),
      fetchFixtures(),
      fetchStandings(),
    ]);

    // Uložíme statická data do public/data jako JSON soubory
    const dataDir = path.join(process.cwd(), "public", "data");

    await Promise.all([
      writeFile(
        path.join(dataDir, "teams.json"),
        JSON.stringify(teams, null, 2)
      ),
      writeFile(
        path.join(dataDir, "fixtures.json"),
        JSON.stringify(fixtures, null, 2)
      ),
    ]);

    // Uložíme živá data do KV
    await kvSet(KV_KEYS.standings, standings);

    return NextResponse.json({
      ok: true,
      teams: teams.length,
      fixtures: fixtures.length,
      message: "Inicializace dokončena. Soubory uloženy do public/data/.",
    });
  } catch (error) {
    console.error("Init selhal:", error);
    return NextResponse.json({ error: "Init selhal" }, { status: 500 });
  }
}
