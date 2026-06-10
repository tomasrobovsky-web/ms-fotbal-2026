const BASE_URL = "https://v3.football.api-sports.io";
const LEAGUE_ID = 1;
const SEASON = 2026;

function getHeaders() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY není nastaven");
  return {
    "x-apisports-key": key,
  };
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: getHeaders(),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`API-Football chyba: ${res.status}`);
  const json = await res.json();
  return json.response as T;
}

export type ApiTeam = {
  team: { id: number; name: string; code: string; logo: string };
  venue: { id: number; name: string; city: string };
};

export type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed: number | null };
    venue: { id: number; name: string; city: string };
  };
  league: {
    id: number;
    round: string;
    group: string | null;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
};

export type ApiStanding = {
  group: string;
  all: ApiStandingTeam[];
};

export type ApiStandingTeam = {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
};

export type ApiPlayer = {
  player: { id: number; name: string; nationality: string; photo: string };
  statistics: { team: { id: number; name: string }; goals: { total: number | null; assists: number | null } }[];
};

export async function fetchTeams(): Promise<ApiTeam[]> {
  return apiFetch<ApiTeam[]>(`/teams?league=${LEAGUE_ID}&season=${SEASON}`);
}

export async function fetchFixtures(): Promise<ApiFixture[]> {
  return apiFetch<ApiFixture[]>(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}`);
}

export async function fetchFixturesByDate(date: string): Promise<ApiFixture[]> {
  return apiFetch<ApiFixture[]>(
    `/fixtures?league=${LEAGUE_ID}&season=${SEASON}&date=${date}`
  );
}

export async function fetchFixtureDetail(fixtureId: number): Promise<ApiFixture[]> {
  return apiFetch<ApiFixture[]>(`/fixtures?id=${fixtureId}`);
}

export async function fetchStandings(): Promise<ApiStanding[][]> {
  return apiFetch<ApiStanding[][]>(
    `/standings?league=${LEAGUE_ID}&season=${SEASON}`
  );
}

export async function fetchTopScorers(): Promise<ApiPlayer[]> {
  return apiFetch<ApiPlayer[]>(
    `/players/topscorers?league=${LEAGUE_ID}&season=${SEASON}`
  );
}

export async function fetchTopAssists(): Promise<ApiPlayer[]> {
  return apiFetch<ApiPlayer[]>(
    `/players/topassists?league=${LEAGUE_ID}&season=${SEASON}`
  );
}

export async function fetchSquad(teamId: number) {
  return apiFetch(`/players/squads?team=${teamId}`);
}

export { LEAGUE_ID, SEASON };
