import type { TeamCode, TvChannel } from "./match-data";

// Přenosy základní skupiny podle oficiálního rozpisu (ČT sport / Nova Sport).
// Klíčujeme přes neuspořádanou dvojici týmů – ve skupinové fázi je každá dvojice
// jedinečná, takže nezáleží na pořadí domácí/host ani na datu.
// Zápasy skupiny A (s ČR) běží na obou stanicích zároveň.

const CT_SPORT: [TeamCode, TeamCode][] = [
  ["MEX", "RSA"], ["KOR", "CZE"], ["USA", "PRY"], ["QAT", "SUI"], ["BRA", "MAR"],
  ["GER", "CUW"], ["BEL", "EGY"], ["KSA", "URU"], ["IRN", "NZL"], ["IRQ", "NOR"],
  ["AUT", "JOR"], ["POR", "COD"], ["GHA", "PAN"], ["CZE", "RSA"], ["MEX", "KOR"],
  ["USA", "AUS"], ["BRA", "HTI"], ["TUR", "PRY"], ["NED", "SWE"], ["ECU", "CUW"],
  ["TUN", "JPN"], ["BEL", "IRN"], ["URU", "CPV"], ["FRA", "IRQ"], ["JOR", "ALG"],
  ["ENG", "GHA"], ["BIH", "QAT"], ["CZE", "MEX"], ["RSA", "KOR"], ["CUW", "CIV"],
  ["TUN", "NED"], ["PRY", "AUS"], ["NOR", "FRA"], ["URU", "ESP"], ["EGY", "IRN"],
  ["CRO", "GHA"], ["COD", "UZB"], ["JOR", "ARG"],
];

const NOVA_SPORT: [TeamCode, TeamCode][] = [
  ["MEX", "RSA"], ["KOR", "CZE"], ["CAN", "BIH"], ["HTI", "SCO"], ["AUS", "TUR"],
  ["NED", "JPN"], ["CIV", "ECU"], ["SWE", "TUN"], ["ESP", "CPV"], ["FRA", "SEN"],
  ["ARG", "ALG"], ["ENG", "CRO"], ["UZB", "COL"], ["CZE", "RSA"], ["SUI", "BIH"],
  ["CAN", "QAT"], ["MEX", "KOR"], ["SCO", "MAR"], ["GER", "CIV"], ["ESP", "KSA"],
  ["NZL", "EGY"], ["ARG", "AUT"], ["NOR", "SEN"], ["POR", "UZB"], ["PAN", "CRO"],
  ["COL", "COD"], ["SCO", "BRA"], ["CZE", "MEX"], ["RSA", "KOR"], ["ECU", "GER"],
  ["JPN", "SWE"], ["TUR", "USA"], ["SEN", "IRQ"], ["CPV", "KSA"], ["NZL", "BEL"],
  ["PAN", "ENG"], ["COL", "POR"], ["ALG", "AUT"],
];

const pairKey = (a: string, b: string) => [a, b].sort().join("-");

const TV_MAP = new Map<string, TvChannel[]>();
for (const [a, b] of CT_SPORT) {
  const k = pairKey(a, b);
  TV_MAP.set(k, [...(TV_MAP.get(k) ?? []), "ct_sport"]);
}
for (const [a, b] of NOVA_SPORT) {
  const k = pairKey(a, b);
  const cur = TV_MAP.get(k) ?? [];
  if (!cur.includes("nova_sport")) TV_MAP.set(k, [...cur, "nova_sport"]);
}

// Stanice, na kterých zápas běží. Pořadí: ČT sport, pak Nova Sport.
export function tvForPair(home: TeamCode, away: TeamCode): TvChannel[] | undefined {
  return TV_MAP.get(pairKey(home, away));
}
