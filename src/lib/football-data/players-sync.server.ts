import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

import {
  FOOTBALL_DATA_RATE_LIMIT_MS,
  fetchTeamById,
  fetchWorldCupTeams,
} from "./client.server";
import type { FootballDataPerson, FootballDataTeam } from "./types";

type DbClient = SupabaseClient<Database>;

export type PlayersSyncResult = {
  playersUpserted: number;
  teamsProcessed: number;
  teamsWithSquad: number;
  source: "competition" | "per_team" | "none";
  message: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function playerName(person: FootballDataPerson): string | null {
  const name = person.name?.trim()
    || [person.firstName, person.lastName].filter(Boolean).join(" ").trim();
  return name || null;
}

async function resolveTeamId(
  supabase: DbClient,
  apiTeam: FootballDataTeam,
  cache: Map<string, string>,
): Promise<string | null> {
  const extId = apiTeam.id != null ? String(apiTeam.id) : null;
  if (!extId) return null;
  if (cache.has(extId)) return cache.get(extId)!;

  const { data: byExternal } = await supabase
    .from("teams")
    .select("id")
    .eq("external_id", extId)
    .maybeSingle();

  if (byExternal) {
    cache.set(extId, byExternal.id);
    return byExternal.id;
  }

  if (apiTeam.name) {
    const { data: byName } = await supabase
      .from("teams")
      .select("id, external_id")
      .ilike("name", apiTeam.name)
      .maybeSingle();

    if (byName) {
      if (!byName.external_id) {
        await supabase.from("teams").update({ external_id: extId }).eq("id", byName.id);
      }
      cache.set(extId, byName.id);
      return byName.id;
    }
  }

  return null;
}

async function upsertSquad(
  supabase: DbClient,
  teamId: string | null,
  squad: FootballDataPerson[] | null | undefined,
): Promise<number> {
  if (!squad?.length) return 0;

  let count = 0;
  for (const person of squad) {
    if (person.role && person.role !== "PLAYER") continue;
    const name = playerName(person);
    if (!name) continue;

    const payload = {
      external_id: String(person.id),
      team_id: teamId,
      name,
      position: person.position ?? null,
      nationality: person.nationality ?? null,
      shirt_number: person.shirtNumber ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("players")
      .select("id")
      .eq("external_id", payload.external_id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("players").update(payload).eq("id", existing.id);
      if (error) throw new Error(`Jucător ${name}: ${error.message}`);
    } else if (teamId) {
      const { data: byTeamName } = await supabase
        .from("players")
        .select("id")
        .eq("team_id", teamId)
        .ilike("name", name)
        .maybeSingle();

      if (byTeamName) {
        const { error } = await supabase.from("players").update(payload).eq("id", byTeamName.id);
        if (error) throw new Error(`Jucător ${name}: ${error.message}`);
      } else {
        const { error } = await supabase.from("players").insert(payload);
        if (error) throw new Error(`Jucător ${name}: ${error.message}`);
      }
    } else {
      const { error } = await supabase.from("players").insert({ ...payload, team_id: null });
      if (error) throw new Error(`Jucător ${name}: ${error.message}`);
    }
    count++;
  }
  return count;
}

export async function syncPlayersFromFootballData(supabase: DbClient): Promise<PlayersSyncResult> {
  const teamCache = new Map<string, string>();
  let playersUpserted = 0;
  let teamsWithSquad = 0;

  const { teams } = await fetchWorldCupTeams(2026);
  let source: PlayersSyncResult["source"] = "competition";
  let teamsProcessed = teams.length;

  const competitionSquads = teams.filter((t) => t.squad && t.squad.length > 0);

  if (competitionSquads.length > 0) {
    for (const apiTeam of competitionSquads) {
      const teamId = await resolveTeamId(supabase, apiTeam, teamCache);
      const n = await upsertSquad(supabase, teamId, apiTeam.squad);
      if (n > 0) teamsWithSquad++;
      playersUpserted += n;
    }
  } else {
    source = "per_team";
    const { data: dbTeams } = await supabase
      .from("teams")
      .select("id, external_id, name")
      .not("external_id", "is", null);

    const list = dbTeams ?? [];
    teamsProcessed = list.length;

    if (list.length === 0) {
      return {
        playersUpserted: 0,
        teamsProcessed: 0,
        teamsWithSquad: 0,
        source: "none",
        message: "API-ul nu are loturi WC2026 încă și nu există echipe cu external_id. Importă manual un fișier CSV/JSON.",
      };
    }

    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      if (!t.external_id) continue;
      if (i > 0) await sleep(FOOTBALL_DATA_RATE_LIMIT_MS);

      const detail = await fetchTeamById(t.external_id);
      teamCache.set(t.external_id, t.id);
      const n = await upsertSquad(supabase, t.id, detail.squad);
      if (n > 0) teamsWithSquad++;
      playersUpserted += n;
    }
  }

  const message = playersUpserted > 0
    ? `Importate ${playersUpserted} jucători din ${teamsWithSquad} echipe (sursă: ${source}).`
    : "API-ul football-data.org nu are încă loturile publicate pentru WC2026. Folosește import manual CSV/JSON.";

  return {
    playersUpserted,
    teamsProcessed,
    teamsWithSquad,
    source: playersUpserted > 0 ? source : "none",
    message,
  };
}
