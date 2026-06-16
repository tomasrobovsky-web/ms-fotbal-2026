export type TeamCode =
  | "CZE" | "ARG" | "MEX" | "MAR" | "BRA"
  | "SUI" | "ESP" | "JPN" | "FRA" | "CRO"
  // Group A
  | "RSA" | "KOR"
  // Group B
  | "CAN" | "BIH" | "QAT"
  // Group C
  | "HTI" | "SCO"
  // Group D
  | "USA" | "PRY" | "AUS" | "TUR"
  // Group E
  | "GER" | "CUW" | "CIV" | "ECU"
  // Group F
  | "NED" | "SWE" | "TUN"
  // Group G
  | "BEL" | "EGY" | "IRN" | "NZL"
  // Group H
  | "CPV" | "KSA" | "URU"
  // Group I
  | "SEN" | "IRQ" | "NOR"
  // Group J
  | "ALG" | "AUT" | "JOR"
  // Group K
  | "POR" | "COD" | "UZB" | "COL"
  // Group L
  | "ENG" | "GHA" | "PAN";

export type Team = { name: string; short: string };

export type MatchStatus = "upcoming" | "live" | "finished";

/** TV vysílatel zápasu. Zápas může běžet na jedné nebo obou stanicích. */
export type TvChannel = "ct_sport" | "nova_sport";

/** Fixní datum zahájení turnaje (pražské), "YYYY-MM-DD". Pro výpočet „Den X". */
export const TOURNAMENT_START = "2026-06-11";

export type MatchEvent = {
  minute: number;
  type: "goal" | "yellow" | "red" | "sub";
  team: "h" | "a";
  player: string;
  assist?: string;
  off?: string;
};

export type Match = {
  id: string;
  /** Relativní den u statických ukázek; reálná data používají `date`. */
  day?: -1 | 0 | 1;
  /** Pražské datum zápasu, "YYYY-MM-DD". Doplňuje adaptér v lib/schedule.ts. */
  date?: string;
  group: string;
  stadium: string;
  city: string;
  status: MatchStatus;
  minute?: number;
  kickoff: string;
  home: TeamCode;
  away: TeamCode;
  score: { h: number | null; a: number | null };
  reds: { h?: boolean; a?: boolean };
  highlights: boolean;
  tv?: TvChannel[];
  events: MatchEvent[];
  /** Sestavy (z detailu zápasu / fallback z ukázky). */
  lineups?: TeamLineups | null;
  /** Statistiky (donuts + bars) z detailu zápasu. */
  stats?: MatchStats | null;
};

export type StandingRow = {
  code: TeamCode;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
};

export type GroupData = {
  group: string;
  rows: StandingRow[];
};

export type PlayerPos = "GK" | "DF" | "MF" | "FW";
export type XIPlayer = { name: string; num: number | null; pos: PlayerPos; club: string; photo?: string | null; clubLogo?: string | null };
export type BenchPlayer = { name: string; pos: PlayerPos; club: string; photo?: string | null; clubLogo?: string | null };
export type Lineup = { form: string; xi: XIPlayer[]; bench: BenchPlayer[] };
export type TeamLineups = { home: Lineup; away: Lineup };
export type MatchStats = {
  donuts: [string, number, number][];
  bars: [string, number, number][];
};

export const TEAMS: Record<TeamCode, Team> = {
  // Original
  CZE: { name: "Česko",           short: "CZE" },
  ARG: { name: "Argentina",       short: "ARG" },
  MEX: { name: "Mexiko",          short: "MEX" },
  MAR: { name: "Maroko",          short: "MAR" },
  BRA: { name: "Brazílie",        short: "BRA" },
  SUI: { name: "Švýcarsko",       short: "SUI" },
  ESP: { name: "Španělsko",       short: "ESP" },
  JPN: { name: "Japonsko",        short: "JPN" },
  FRA: { name: "Francie",         short: "FRA" },
  CRO: { name: "Chorvatsko",      short: "CRO" },
  // Group A
  RSA: { name: "Jihoafrická rep.", short: "RSA" },
  KOR: { name: "Jižní Korea",     short: "KOR" },
  // Group B
  CAN: { name: "Kanada",          short: "CAN" },
  BIH: { name: "Bosna a Herceg.", short: "BIH" },
  QAT: { name: "Katar",           short: "QAT" },
  // Group C
  HTI: { name: "Haiti",           short: "HTI" },
  SCO: { name: "Skotsko",         short: "SCO" },
  // Group D
  USA: { name: "USA",             short: "USA" },
  PRY: { name: "Paraguay",        short: "PRY" },
  AUS: { name: "Austrálie",       short: "AUS" },
  TUR: { name: "Turecko",         short: "TUR" },
  // Group E
  GER: { name: "Německo",         short: "GER" },
  CUW: { name: "Curaçao",         short: "CUW" },
  CIV: { name: "Pobř. slonoviny", short: "CIV" },
  ECU: { name: "Ekvádor",         short: "ECU" },
  // Group F
  NED: { name: "Nizozemsko",      short: "NED" },
  SWE: { name: "Švédsko",         short: "SWE" },
  TUN: { name: "Tunisko",         short: "TUN" },
  // Group G
  BEL: { name: "Belgie",          short: "BEL" },
  EGY: { name: "Egypt",           short: "EGY" },
  IRN: { name: "Írán",            short: "IRN" },
  NZL: { name: "Nový Zéland",     short: "NZL" },
  // Group H
  CPV: { name: "Kapverdy",        short: "CPV" },
  KSA: { name: "S. Arábie",       short: "KSA" },
  URU: { name: "Uruguay",         short: "URU" },
  // Group I
  SEN: { name: "Senegal",         short: "SEN" },
  IRQ: { name: "Irák",            short: "IRQ" },
  NOR: { name: "Norsko",          short: "NOR" },
  // Group J
  ALG: { name: "Alžírsko",        short: "ALG" },
  AUT: { name: "Rakousko",        short: "AUT" },
  JOR: { name: "Jordánsko",       short: "JOR" },
  // Group K
  POR: { name: "Portugalsko",     short: "POR" },
  COD: { name: "DR Kongo",        short: "COD" },
  UZB: { name: "Uzbekistán",      short: "UZB" },
  COL: { name: "Kolumbie",        short: "COL" },
  // Group L
  ENG: { name: "Anglie",          short: "ENG" },
  GHA: { name: "Ghana",           short: "GHA" },
  PAN: { name: "Panama",          short: "PAN" },
};

// Mapování anglických názvů z public/data/schedule.json (TheSportsDB) na naše kódy.
export const NAME_TO_CODE: Record<string, TeamCode> = {
  "Algeria": "ALG",
  "Argentina": "ARG",
  "Australia": "AUS",
  "Austria": "AUT",
  "Belgium": "BEL",
  "Bosnia-Herzegovina": "BIH",
  "Brazil": "BRA",
  "Canada": "CAN",
  "Cape Verde": "CPV",
  "Colombia": "COL",
  "Croatia": "CRO",
  "Curaçao": "CUW",
  "Czech Republic": "CZE",
  "DR Congo": "COD",
  "Ecuador": "ECU",
  "Egypt": "EGY",
  "England": "ENG",
  "France": "FRA",
  "Germany": "GER",
  "Ghana": "GHA",
  "Haiti": "HTI",
  "Iran": "IRN",
  "Iraq": "IRQ",
  "Ivory Coast": "CIV",
  "Japan": "JPN",
  "Jordan": "JOR",
  "Mexico": "MEX",
  "Morocco": "MAR",
  "Netherlands": "NED",
  "New Zealand": "NZL",
  "Norway": "NOR",
  "Panama": "PAN",
  "Paraguay": "PRY",
  "Portugal": "POR",
  "Qatar": "QAT",
  "Saudi Arabia": "KSA",
  "Scotland": "SCO",
  "Senegal": "SEN",
  "South Africa": "RSA",
  "South Korea": "KOR",
  "Spain": "ESP",
  "Sweden": "SWE",
  "Switzerland": "SUI",
  "Tunisia": "TUN",
  "Turkey": "TUR",
  "USA": "USA",
  "Uruguay": "URU",
  "Uzbekistan": "UZB",
};

export const TEAM_COLOR: Record<TeamCode, string> = {
  CZE: "#2f6fd6", ARG: "#74b3e8", MEX: "#1f8a4c", MAR: "#c01539",
  BRA: "#f4c20d", SUI: "#e11d2a", ESP: "#d11a3a", JPN: "#cf0a3c",
  FRA: "#2746b8", CRO: "#d11a3a",
  RSA: "#007A4D", KOR: "#C60C30",
  CAN: "#FF0000", BIH: "#003DA5", QAT: "#8D153A",
  HTI: "#00209F", SCO: "#003078",
  USA: "#B22234", PRY: "#D52B1E", AUS: "#00008B", TUR: "#E30A17",
  GER: "#FFCE00", CUW: "#003DA5", CIV: "#F77F00", ECU: "#FFD100",
  NED: "#AE1C28", SWE: "#006AA7", TUN: "#E70013",
  BEL: "#EF3340", EGY: "#CE1126", IRN: "#239F40", NZL: "#00247D",
  CPV: "#003893", KSA: "#006C35", URU: "#5B9BD5",
  SEN: "#00853F", IRQ: "#CE1126", NOR: "#EF2B2D",
  ALG: "#006233", AUT: "#ED2939", JOR: "#007A3D",
  POR: "#006600", COD: "#007FFF", UZB: "#1EB53A", COL: "#FCD116",
  ENG: "#C8102E", GHA: "#006B3F", PAN: "#DA121A",
};

export const MATCHES: Match[] = [
  {
    id: "arg-mex", day: -1, group: "C",
    stadium: "MetLife Stadium", city: "New York",
    status: "finished", kickoff: "21:00",
    home: "ARG", away: "MEX",
    score: { h: 2, a: 1 }, reds: {}, highlights: true,
    events: [
      { minute: 12, type: "goal",   team: "h", player: "Álvarez",   assist: "Messi" },
      { minute: 34, type: "yellow", team: "a", player: "Edson Á." },
      { minute: 51, type: "goal",   team: "a", player: "Jiménez",   assist: "" },
      { minute: 63, type: "sub",    team: "h", player: "Lautaro",   off: "J. Álvarez" },
      { minute: 78, type: "goal",   team: "h", player: "Lautaro",   assist: "Messi" },
      { minute: 89, type: "yellow", team: "h", player: "De Paul" },
    ],
  },
  {
    id: "bra-sui", day: -1, group: "A",
    stadium: "SoFi Stadium", city: "Los Angeles",
    status: "finished", kickoff: "18:00",
    home: "BRA", away: "SUI",
    score: { h: 3, a: 1 }, reds: {}, highlights: true,
    events: [
      { minute: 8,  type: "goal", team: "h", player: "Vinícius Jr.", assist: "Raphinha" },
      { minute: 27, type: "goal", team: "h", player: "Rodrygo",      assist: "" },
      { minute: 55, type: "goal", team: "a", player: "Embolo",       assist: "" },
      { minute: 81, type: "goal", team: "h", player: "Endrick",      assist: "Vinícius Jr." },
    ],
  },
  {
    id: "cze-mar", day: 0, group: "C",
    stadium: "AT&T Stadium", city: "Dallas",
    status: "live", minute: 67, kickoff: "18:00",
    home: "CZE", away: "MAR",
    score: { h: 1, a: 1 }, reds: { a: true }, highlights: false, tv: ["ct_sport"],
    events: [
      { minute: 23, type: "goal",   team: "h", player: "Schick",     assist: "Šulc" },
      { minute: 41, type: "yellow", team: "h", player: "Souček" },
      { minute: 58, type: "goal",   team: "a", player: "En-Nesyri",  assist: "Ziyech" },
      { minute: 64, type: "red",    team: "a", player: "Amrabat" },
    ],
  },
  {
    id: "esp-jpn", day: 0, group: "E",
    stadium: "Levi's Stadium", city: "San Francisco",
    status: "upcoming", kickoff: "21:00",
    home: "ESP", away: "JPN",
    score: { h: null, a: null }, reds: {}, highlights: false, tv: ["ct_sport"],
    events: [],
  },
  {
    id: "arg-cze", day: 1, group: "C",
    stadium: "Hard Rock Stadium", city: "Miami",
    status: "upcoming", kickoff: "21:00",
    home: "ARG", away: "CZE",
    score: { h: null, a: null }, reds: {}, highlights: false, tv: ["ct_sport"],
    events: [],
  },
  {
    id: "fra-cro", day: 1, group: "F",
    stadium: "Mercedes-Benz Stadium", city: "Atlanta",
    status: "upcoming", kickoff: "18:00",
    home: "FRA", away: "CRO",
    score: { h: null, a: null }, reds: {}, highlights: false, tv: ["ct_sport"],
    events: [],
  },
];

export const GROUP_C: StandingRow[] = [
  { code: "ARG", p: 1, w: 1, d: 0, l: 0, gf: 2, ga: 1, pts: 3 },
  { code: "CZE", p: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1 },
  { code: "MAR", p: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1 },
  { code: "MEX", p: 1, w: 0, d: 0, l: 1, gf: 1, ga: 2, pts: 0 },
];

export const ALL_GROUPS: GroupData[] = [
  {
    group: "A",
    rows: [
      { code: "CZE", p: 1, w: 1, d: 0, l: 0, gf: 2, ga: 0, pts: 3 },
      { code: "MEX", p: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1 },
      { code: "KOR", p: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1 },
      { code: "RSA", p: 1, w: 0, d: 0, l: 1, gf: 0, ga: 2, pts: 0 },
    ],
  },
  {
    group: "B",
    rows: [
      { code: "CAN", p: 1, w: 1, d: 0, l: 0, gf: 2, ga: 0, pts: 3 },
      { code: "SUI", p: 1, w: 1, d: 0, l: 0, gf: 2, ga: 1, pts: 3 },
      { code: "BIH", p: 1, w: 0, d: 0, l: 1, gf: 1, ga: 2, pts: 0 },
      { code: "QAT", p: 1, w: 0, d: 0, l: 1, gf: 0, ga: 2, pts: 0 },
    ],
  },
  {
    group: "C",
    rows: [
      { code: "BRA", p: 1, w: 1, d: 0, l: 0, gf: 3, ga: 1, pts: 3 },
      { code: "MAR", p: 1, w: 1, d: 0, l: 0, gf: 2, ga: 0, pts: 3 },
      { code: "SCO", p: 1, w: 0, d: 0, l: 1, gf: 1, ga: 3, pts: 0 },
      { code: "HTI", p: 1, w: 0, d: 0, l: 1, gf: 0, ga: 2, pts: 0 },
    ],
  },
  {
    group: "D",
    rows: [
      { code: "TUR", p: 1, w: 1, d: 0, l: 0, gf: 2, ga: 0, pts: 3 },
      { code: "USA", p: 1, w: 1, d: 0, l: 0, gf: 1, ga: 0, pts: 3 },
      { code: "PRY", p: 1, w: 0, d: 0, l: 1, gf: 0, ga: 1, pts: 0 },
      { code: "AUS", p: 1, w: 0, d: 0, l: 1, gf: 0, ga: 2, pts: 0 },
    ],
  },
  {
    group: "E",
    rows: [
      { code: "GER", p: 1, w: 1, d: 0, l: 0, gf: 3, ga: 0, pts: 3 },
      { code: "CIV", p: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1 },
      { code: "CUW", p: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1 },
      { code: "ECU", p: 1, w: 0, d: 0, l: 1, gf: 0, ga: 3, pts: 0 },
    ],
  },
  {
    group: "F",
    rows: [
      { code: "NED", p: 1, w: 1, d: 0, l: 0, gf: 3, ga: 1, pts: 3 },
      { code: "JPN", p: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1 },
      { code: "SWE", p: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1 },
      { code: "TUN", p: 1, w: 0, d: 0, l: 1, gf: 1, ga: 3, pts: 0 },
    ],
  },
  {
    group: "G",
    rows: [
      { code: "BEL", p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { code: "EGY", p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { code: "IRN", p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { code: "NZL", p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
    ],
  },
  {
    group: "H",
    rows: [
      { code: "ESP", p: 1, w: 1, d: 0, l: 0, gf: 3, ga: 0, pts: 3 },
      { code: "URU", p: 1, w: 1, d: 0, l: 0, gf: 2, ga: 1, pts: 3 },
      { code: "KSA", p: 1, w: 0, d: 0, l: 1, gf: 0, ga: 3, pts: 0 },
      { code: "CPV", p: 1, w: 0, d: 0, l: 1, gf: 1, ga: 2, pts: 0 },
    ],
  },
  {
    group: "I",
    rows: [
      { code: "FRA", p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { code: "SEN", p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { code: "IRQ", p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { code: "NOR", p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
    ],
  },
  {
    group: "J",
    rows: [
      { code: "ARG", p: 1, w: 1, d: 0, l: 0, gf: 2, ga: 0, pts: 3 },
      { code: "AUT", p: 1, w: 1, d: 0, l: 0, gf: 1, ga: 0, pts: 3 },
      { code: "ALG", p: 1, w: 0, d: 0, l: 1, gf: 0, ga: 1, pts: 0 },
      { code: "JOR", p: 1, w: 0, d: 0, l: 1, gf: 0, ga: 2, pts: 0 },
    ],
  },
  {
    group: "K",
    rows: [
      { code: "POR", p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { code: "COL", p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { code: "COD", p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { code: "UZB", p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
    ],
  },
  {
    group: "L",
    rows: [
      { code: "ENG", p: 1, w: 1, d: 0, l: 0, gf: 3, ga: 0, pts: 3 },
      { code: "GHA", p: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1 },
      { code: "CRO", p: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1 },
      { code: "PAN", p: 1, w: 0, d: 0, l: 1, gf: 0, ga: 3, pts: 0 },
    ],
  },
];

// Odvozené z ALL_GROUPS: kód týmu -> písmeno skupiny (pro patičku karty zápasu).
export const TEAM_GROUP: Partial<Record<TeamCode, string>> = Object.fromEntries(
  ALL_GROUPS.flatMap((g) => g.rows.map((r) => [r.code, g.group] as const))
) as Partial<Record<TeamCode, string>>;

export const NEXT_CZE = {
  dateLabel: "13. června, 21:00",
  opponent: "ARG" as TeamCode,
  daysToStart: 1,
};

// Ukázkové sestavy + statistiky (fallback, když reálná data z API chybí/jsou
// neúplná) jsou v `lib/sample-detail.ts`.
