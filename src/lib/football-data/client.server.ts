import type {
  FootballDataMatchesResponse,
  FootballDataTeam,
  FootballDataTeamsResponse,
} from "./types";

const API_BASE = "https://api.football-data.org/v4";

function getToken(): string {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!token) {
    throw new Error("FOOTBALL_DATA_API_TOKEN lipsește din variabilele de mediu.");
  }
  return token;
}

async function footballDataFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "X-Auth-Token": getToken() },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`football-data.org error ${res.status}: ${body || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchWorldCupMatches(season = 2026): Promise<FootballDataMatchesResponse> {
  return footballDataFetch<FootballDataMatchesResponse>(
    `/competitions/WC/matches?season=${season}&limit=200`,
  );
}

export async function fetchWorldCupTeams(season = 2026): Promise<FootballDataTeamsResponse> {
  return footballDataFetch<FootballDataTeamsResponse>(
    `/competitions/WC/teams?season=${season}`,
  );
}

export async function fetchTeamById(teamId: string | number): Promise<FootballDataTeam> {
  return footballDataFetch<FootballDataTeam>(`/teams/${teamId}`);
}

export const FOOTBALL_DATA_RATE_LIMIT_MS = 6500;
