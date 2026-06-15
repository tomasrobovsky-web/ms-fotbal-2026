// Ukázkové (realistické) sestavy + statistiky z designu — slouží jako fallback,
// když reálná data z TheSportsDB chybí nebo jsou na free klíči neúplná (cap 5).
// Po doplnění premium klíče (THESPORTSDB_KEY) převáží reálná data z detailu.

import type {
  TeamCode, PlayerPos, Lineup, TeamLineups, MatchStats, Match, BenchPlayer,
} from "./match-data";

export const POS: Record<PlayerPos, { label: string; color: string }> = {
  GK: { label: "Brankář", color: "#f5b933" },
  DF: { label: "Obránce", color: "#38bdf8" },
  MF: { label: "Záložník", color: "#34d399" },
  FW: { label: "Útočník", color: "#fb7185" },
};

// Pozice odvozená z formace a pořadí v základní jedenáctce.
export function positionFor(form: string, idx: number): PlayerPos {
  if (idx === 0) return "GK";
  const lines = form.split("-").map(Number);
  let acc = 1;
  for (let li = 0; li < lines.length; li++) {
    if (idx < acc + lines[li]) return li === 0 ? "DF" : li === lines.length - 1 ? "FW" : "MF";
    acc += lines[li];
  }
  return "MF";
}

type RawLineup = { form: string; xi: string[]; clubs: string[]; bench: BenchPlayer[] };

const RAW: Partial<Record<TeamCode, RawLineup>> = {
  CZE: {
    form: "4-2-3-1",
    xi: ["Staněk", "Coufal", "Hranáč", "Krejčí", "Doudera", "Souček", "Provod", "Černý", "Šulc", "Barák", "Schick"],
    clubs: ["Slavia Praha", "West Ham", "Hoffenheim", "Girona", "Slavia Praha", "West Ham", "Slavia Praha", "Wolfsburg", "Plzeň", "Kasımpaşa", "Leverkusen"],
    bench: [
      { name: "Kovář", pos: "GK", club: "Leverkusen" }, { name: "Brabec", pos: "DF", club: "Plzeň" },
      { name: "Havel", pos: "DF", club: "Girona" }, { name: "Vlček", pos: "MF", club: "Slavia Praha" },
      { name: "Sadílek", pos: "MF", club: "Twente" }, { name: "Lingr", pos: "FW", club: "Feyenoord" },
      { name: "Vydra", pos: "FW", club: "Trabzonspor" },
    ],
  },
  MAR: {
    form: "4-3-3",
    xi: ["Bono", "Hakimi", "Aguerd", "Saïss", "Mazraoui", "Amrabat", "Ounahi", "Amallah", "Ziyech", "En-Nesyri", "Boufal"],
    clubs: ["Al-Hilal", "PSG", "West Ham", "Al-Shabab", "Man United", "Fiorentina", "Marseille", "Valladolid", "Galatasaray", "Fenerbahçe", "Al-Rayyan"],
    bench: [
      { name: "Yahia", pos: "GK", club: "Zamalek" }, { name: "Dari", pos: "DF", club: "Nott'm Forest" },
      { name: "Aït Boudlal", pos: "DF", club: "Al-Ahli" }, { name: "Sabiri", pos: "MF", club: "Sampdoria" },
      { name: "Ezzalzouli", pos: "FW", club: "Betis" }, { name: "Ez Abde", pos: "FW", club: "Betis" },
      { name: "Benrahma", pos: "FW", club: "Lyon" },
    ],
  },
  ARG: {
    form: "4-4-2",
    xi: ["E. Martínez", "Molina", "Romero", "Otamendi", "Tagliafico", "De Paul", "Mac Allister", "Fernández", "Di María", "Messi", "J. Álvarez"],
    clubs: ["Aston Villa", "Atlético", "Tottenham", "Benfica", "Lyon", "Atlético", "Liverpool", "Chelsea", "Benfica", "Inter Miami", "Man City"],
    bench: [
      { name: "Armani", pos: "GK", club: "River Plate" }, { name: "Lisandro M.", pos: "DF", club: "Man United" },
      { name: "Acuña", pos: "DF", club: "Sevilla" }, { name: "Lo Celso", pos: "MF", club: "Tottenham" },
      { name: "Lautaro", pos: "FW", club: "Inter" }, { name: "Dybala", pos: "FW", club: "Roma" },
      { name: "Correa", pos: "FW", club: "Inter" },
    ],
  },
  MEX: {
    form: "4-3-3",
    xi: ["Ochoa", "Sánchez", "Montes", "Vásquez", "Gallardo", "Edson Á.", "Chávez", "Pineda", "Lozano", "Jiménez", "Vega"],
    clubs: ["Salernitana", "Ajax", "Feyenoord", "LAFC", "Tigres", "Real Betis", "Cruz Azul", "FC Twente", "San Diego", "Fulham", "Monterrey"],
    bench: [
      { name: "González", pos: "GK", club: "Guadalajara" }, { name: "Araujo", pos: "DF", club: "Monterrey" },
      { name: "Moreno", pos: "DF", club: "Tigres" }, { name: "Herrera", pos: "MF", club: "CF Montréal" },
      { name: "Rodríguez", pos: "MF", club: "Rayados" }, { name: "Antuna", pos: "FW", club: "Cruz Azul" },
      { name: "Angulo", pos: "FW", club: "Chivas" },
    ],
  },
  BRA: {
    form: "4-3-3",
    xi: ["Alisson", "Danilo", "Marquinhos", "Silva", "Wendell", "Bruno G.", "Paquetá", "Rodrygo", "Raphinha", "Endrick", "Vinícius Jr."],
    clubs: ["Liverpool", "Juventus", "PSG", "Fluminense", "Porto", "West Ham", "West Ham", "Real Madrid", "Barcelona", "Real Madrid", "Real Madrid"],
    bench: [
      { name: "Bento", pos: "GK", club: "Al-Qadsiah" }, { name: "Militão", pos: "DF", club: "Real Madrid" },
      { name: "Bremer", pos: "DF", club: "Juventus" }, { name: "Gerson", pos: "MF", club: "Flamengo" },
      { name: "Andreas P.", pos: "MF", club: "Fulham" }, { name: "Martinelli", pos: "FW", club: "Arsenal" },
      { name: "Cunha", pos: "FW", club: "Wolves" },
    ],
  },
  SUI: {
    form: "4-2-3-1",
    xi: ["Sommer", "Widmer", "Akanji", "Schär", "Rodríguez", "Freuler", "Xhaka", "Vargas", "Shaqiri", "Ndoye", "Embolo"],
    clubs: ["Inter", "Mainz", "Man City", "Newcastle", "Real Betis", "Bologna", "Leverkusen", "Augsburg", "Basel", "Bologna", "Monaco"],
    bench: [
      { name: "Kobel", pos: "GK", club: "Dortmund" }, { name: "Stergiou", pos: "DF", club: "Stuttgart" },
      { name: "Comert", pos: "DF", club: "Valencia" }, { name: "Aebischer", pos: "MF", club: "Bologna" },
      { name: "Fassnacht", pos: "MF", club: "Union Berlin" }, { name: "Okafor", pos: "FW", club: "Milan" },
      { name: "Kaly Sene", pos: "FW", club: "Lugano" },
    ],
  },
  ESP: {
    form: "4-3-3",
    xi: ["Simón", "Carvajal", "Le Normand", "Laporte", "Cucurella", "Rodri", "Pedri", "Fabián", "Yamal", "Morata", "Williams"],
    clubs: ["Athletic", "Real Madrid", "Atlético", "Al-Nassr", "Chelsea", "Man City", "Barcelona", "PSG", "Barcelona", "Milan", "Athletic"],
    bench: [
      { name: "Remiro", pos: "GK", club: "Real Sociedad" }, { name: "Azpilicueta", pos: "DF", club: "Atlético" },
      { name: "Navas", pos: "DF", club: "Leverkusen" }, { name: "Merino", pos: "MF", club: "Arsenal" },
      { name: "Zubimendi", pos: "MF", club: "Arsenal" }, { name: "Torres", pos: "FW", club: "Barcelona" },
      { name: "Oyarzabal", pos: "FW", club: "Real Sociedad" },
    ],
  },
  JPN: {
    form: "4-2-3-1",
    xi: ["Suzuki", "Sugawara", "Itakura", "Tomiyasu", "Nakayama", "Endo", "Tanaka", "Doan", "Kamada", "Mitoma", "Ueda"],
    clubs: ["Parma", "Southampton", "Mönchengladbach", "Arsenal", "Düsseldorf", "Liverpool", "Leeds", "Freiburg", "Crystal Palace", "Brighton", "Feyenoord"],
    bench: [
      { name: "Osaka", pos: "GK", club: "Vissel Kobe" }, { name: "Fujita", pos: "DF", club: "Sint-Truiden" },
      { name: "Machida", pos: "DF", club: "Lyon" }, { name: "Hatate", pos: "MF", club: "Celtic" },
      { name: "Morita", pos: "MF", club: "Sporting" }, { name: "Asano", pos: "FW", club: "Bochum" },
      { name: "Furuhashi", pos: "FW", club: "Celtic" },
    ],
  },
  FRA: {
    form: "4-3-3",
    xi: ["Maignan", "Koundé", "Saliba", "Upamecano", "T. Hernández", "Tchouaméni", "Camavinga", "Griezmann", "Dembélé", "Mbappé", "Thuram"],
    clubs: ["Milan", "Barcelona", "Arsenal", "Bayern", "Bayern", "Real Madrid", "Real Madrid", "Atlético", "PSG", "Real Madrid", "Juventus"],
    bench: [
      { name: "Lloris", pos: "GK", club: "LA Galaxy" }, { name: "Pavard", pos: "DF", club: "Inter" },
      { name: "Konaté", pos: "DF", club: "Liverpool" }, { name: "Fofana", pos: "MF", club: "Chelsea" },
      { name: "Guendouzi", pos: "MF", club: "Lazio" }, { name: "Kolo Muani", pos: "FW", club: "PSG" },
      { name: "Coman", pos: "FW", club: "Bayern" },
    ],
  },
  CRO: {
    form: "4-3-3",
    xi: ["Livaković", "Stanišić", "Šutalo", "Gvardiol", "Sosa", "Modrić", "Brozović", "Kovačić", "Pašalić", "Kramarić", "Perišić"],
    clubs: ["Dinamo Zagreb", "Leverkusen", "Dortmund", "Man City", "Ajax", "Real Madrid", "Galatasaray", "Man City", "Atalanta", "Hoffenheim", "Hajduk Split"],
    bench: [
      { name: "Ivušić", pos: "GK", club: "Al-Qadsiah" }, { name: "Erlić", pos: "DF", club: "Sassuolo" },
      { name: "Vida", pos: "DF", club: "AEK Athens" }, { name: "Ivanušec", pos: "MF", club: "Dinamo Zagreb" },
      { name: "Rog", pos: "MF", club: "Cagliari" }, { name: "Budimir", pos: "FW", club: "Real Sociedad" },
      { name: "Petković", pos: "FW", club: "Dinamo Zagreb" },
    ],
  },
};

function buildLineup(raw: RawLineup): Lineup {
  return {
    form: raw.form,
    xi: raw.xi.map((name, i) => ({
      name, num: i + 1, pos: positionFor(raw.form, i), club: raw.clubs[i] ?? "—",
    })),
    bench: raw.bench,
  };
}

export const SAMPLE_LINEUPS: Partial<Record<TeamCode, Lineup>> = Object.fromEntries(
  Object.entries(RAW).map(([code, raw]) => [code, buildLineup(raw as RawLineup)])
) as Partial<Record<TeamCode, Lineup>>;

// Ukázkové statistiky pro demo zápasy z designu (donuts + bars).
export const SAMPLE_STATS: Record<string, MatchStats> = {
  "cze-mar": {
    donuts: [["xG", 1.4, 1.1], ["Držení %", 52, 48], ["Na branku", 5, 4], ["Přesnost %", 84, 79], ["Rohy", 6, 3], ["Fauly", 10, 14]],
    bars: [["Střely celkem", 11, 9], ["Střely mimo", 5, 4], ["Zblokované", 1, 1], ["Přihrávky", 412, 356], ["Ofsajdy", 2, 3], ["Zákroky brankáře", 3, 4], ["Žluté karty", 1, 0], ["Červené karty", 0, 1]],
  },
  "arg-mex": {
    donuts: [["xG", 2.1, 0.9], ["Držení %", 61, 39], ["Na branku", 8, 3], ["Přesnost %", 88, 82], ["Rohy", 7, 2], ["Fauly", 9, 13]],
    bars: [["Střely celkem", 16, 7], ["Střely mimo", 6, 3], ["Zblokované", 2, 1], ["Přihrávky", 587, 388], ["Ofsajdy", 3, 2], ["Zákroky brankáře", 2, 6], ["Žluté karty", 1, 1], ["Červené karty", 0, 0]],
  },
  "bra-sui": {
    donuts: [["xG", 2.6, 0.7], ["Držení %", 64, 36], ["Na branku", 9, 2], ["Přesnost %", 90, 80], ["Rohy", 8, 3], ["Fauly", 7, 11]],
    bars: [["Střely celkem", 18, 6], ["Střely mimo", 7, 3], ["Zblokované", 2, 1], ["Přihrávky", 612, 345], ["Ofsajdy", 1, 2], ["Zákroky brankáře", 1, 6], ["Žluté karty", 0, 2], ["Červené karty", 0, 0]],
  },
};

// ── Resolvery: reálná data mají přednost, ukázka doplní neúplné ──────────────

function lineupComplete(l?: Lineup | null): boolean {
  return !!l && l.xi.length >= 11;
}

/** Vrátí sestavy obou týmů: reálné když jsou kompletní, jinak ukázka, jinak částečné reálné. */
export function resolveLineups(match: Match): TeamLineups | null {
  const real = match.lineups ?? null;
  const pick = (side: "home" | "away"): Lineup | null => {
    const code = match[side];
    const realSide = real?.[side];
    if (lineupComplete(realSide)) return realSide!;
    const sample = SAMPLE_LINEUPS[code];
    if (sample) return sample;
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

/** Vrátí statistiky: reálné když mají dost metrik, jinak ukázka pro demo zápasy, jinak reálné. */
export function resolveStats(match: Match): MatchStats | null {
  const real = match.stats ?? null;
  if (statsCount(real) >= 6) return real;
  const sample = SAMPLE_STATS[match.id];
  if (sample) return sample;
  return statsCount(real) > 0 ? real : null;
}
