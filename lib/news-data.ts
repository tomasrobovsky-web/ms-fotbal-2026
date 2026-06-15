// Zprávy se stahují z RSS feedů scriptem `scripts/news-sync.js` do
// `public/data/news.json` a frontend je čte za běhu (client fetch).
// Tady je jen sdílený typ + drobné helpery pro zobrazení.

export type NewsItem = {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  imageUrl: string | null;
  publishedAt: string | null;
};

// Deterministický gradient z názvu zdroje — fallback, když chybí obrázek.
const GRADIENTS: Record<string, [string, string]> = {
  iSport: ["#e2001a", "#7a0010"],
  "Sport.cz": ["#0140EA", "#012a8a"],
  "ČT sport": ["#0a8537", "#063f1c"],
  Eurofotbal: ["#1f6feb", "#0b2a5c"],
  "Nova Sport": ["#d81f26", "#6e0f13"],
};

export function gradientFor(source: string): [string, string] {
  return GRADIENTS[source] ?? ["#2f6fd6", "#0b2a5c"];
}

// Relativní datum v češtině: "dnes" / "včera" / "8.6." — počítá se za běhu.
export function relativeDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";

  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(new Date()) - startOfDay(d)) / 86_400_000
  );

  if (diffDays <= 0) return "dnes";
  if (diffDays === 1) return "včera";
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}
