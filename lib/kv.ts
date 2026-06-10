import { kv } from "@vercel/kv";

export const KV_KEYS = {
  fixtures: (date: string) => `fixtures:${date}`,
  standings: "standings",
  topScorers: "top-scorers",
  topAssists: "top-assists",
  fixtureDetail: (id: number) => `fixture:${id}`,
  lastUpdate: "last-update",
} as const;

export async function kvGet<T>(key: string): Promise<T | null> {
  try {
    return await kv.get<T>(key);
  } catch {
    return null;
  }
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await kv.set(key, value);
}

export async function kvSetWithExpiry(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  await kv.set(key, value, { ex: ttlSeconds });
}
