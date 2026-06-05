import type { FootballDataMatchesResponse } from "./types";

const API_BASE = "https://api.football-data.org/v4";

export async function fetchWorldCupMatches(season = 2026): Promise<FootballDataMatchesResponse> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!token) {
    throw new Error("FOOTBALL_DATA_API_TOKEN lipsește din variabilele de mediu.");
  }

  const url = `${API_BASE}/competitions/WC/matches?season=${season}&limit=200`;
  const res = await fetch(url, {
    headers: { "X-Auth-Token": token },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`football-data.org error ${res.status}: ${body || res.statusText}`);
  }

  return res.json() as Promise<FootballDataMatchesResponse>;
}
