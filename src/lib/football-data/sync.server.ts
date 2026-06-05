import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

import { fetchWorldCupMatches } from "./client.server";
import { mapGroupLetter, mapStage, mapStatus } from "./mappers";
import type { FootballDataMatch, FootballDataTeam } from "./types";

type DbClient = SupabaseClient<Database>;

export type SyncResult = {
  teamsUpserted: number;
  matchesUpserted: number;
  matchesSkipped: number;
  totalTeams: number;
  totalMatches: number;
};

function teamExternalId(team: FootballDataTeam): string | null {
  return team.id != null ? String(team.id) : null;
}

async function upsertTeam(
  supabase: DbClient,
  team: FootballDataTeam,
  groupLetter: string | null,
  cache: Map<string, string>,
): Promise<string | null> {
  const extId = teamExternalId(team);
  if (!extId || !team.name) return null;

  if (cache.has(extId)) return cache.get(extId)!;

  const { data: byExternal } = await supabase
    .from("teams")
    .select("id")
    .eq("external_id", extId)
    .maybeSingle();

  if (byExternal) {
    await supabase
      .from("teams")
      .update({
        name: team.name,
        code: team.tla,
        group_letter: groupLetter,
      })
      .eq("id", byExternal.id);
    cache.set(extId, byExternal.id);
    return byExternal.id;
  }

  const { data: byName } = await supabase
    .from("teams")
    .select("id, external_id")
    .ilike("name", team.name)
    .maybeSingle();

  if (byName) {
    await supabase
      .from("teams")
      .update({
        external_id: extId,
        code: team.tla,
        group_letter: groupLetter,
      })
      .eq("id", byName.id);
    cache.set(extId, byName.id);
    return byName.id;
  }

  const { data: inserted, error } = await supabase
    .from("teams")
    .insert({
      external_id: extId,
      name: team.name,
      code: team.tla,
      group_letter: groupLetter,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Echipă ${team.name}: ${error.message}`);

  cache.set(extId, inserted.id);
  return inserted.id;
}

async function upsertMatch(
  supabase: DbClient,
  match: FootballDataMatch,
  teamCache: Map<string, string>,
): Promise<"upserted" | "skipped"> {
  const extId = String(match.id);
  const groupLetter = mapGroupLetter(match.group);
  const stage = mapStage(match.stage);
  const status = mapStatus(match.status);

  let homeTeamId: string | null = null;
  let awayTeamId: string | null = null;

  if (match.homeTeam.id != null && match.homeTeam.name) {
    homeTeamId = await upsertTeam(supabase, match.homeTeam, groupLetter, teamCache);
  }
  if (match.awayTeam.id != null && match.awayTeam.name) {
    awayTeamId = await upsertTeam(supabase, match.awayTeam, groupLetter, teamCache);
  }

  const payload = {
    external_id: extId,
    kickoff_at: match.utcDate,
    stage,
    status,
    group_letter: groupLetter,
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    home_team_label: homeTeamId ? null : (match.homeTeam.name ?? match.homeTeam.shortName),
    away_team_label: awayTeamId ? null : (match.awayTeam.name ?? match.awayTeam.shortName),
    home_score: match.score.fullTime.home,
    away_score: match.score.fullTime.away,
  };

  const { data: existing } = await supabase
    .from("matches")
    .select("id")
    .eq("external_id", extId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("matches").update(payload).eq("id", existing.id);
    if (error) throw new Error(`Meci ${extId}: ${error.message}`);
    return "upserted";
  }

  const { error } = await supabase.from("matches").insert(payload);
  if (error) throw new Error(`Meci ${extId}: ${error.message}`);
  return "upserted";
}

export async function syncFootballDataToSupabase(supabase: DbClient): Promise<SyncResult> {
  const { matches } = await fetchWorldCupMatches();
  const teamCache = new Map<string, string>();
  let teamsUpserted = 0;
  let matchesUpserted = 0;
  let matchesSkipped = 0;

  const seenTeams = new Set<string>();
  for (const match of matches) {
    for (const team of [match.homeTeam, match.awayTeam]) {
      const extId = teamExternalId(team);
      if (!extId || !team.name) continue;
      seenTeams.add(extId);
      if (teamCache.has(extId)) continue;
      await upsertTeam(supabase, team, mapGroupLetter(match.group), teamCache);
      teamsUpserted++;
    }
  }

  for (const match of matches) {
    const result = await upsertMatch(supabase, match, teamCache);
    if (result === "upserted") matchesUpserted++;
    else matchesSkipped++;
  }

  return {
    teamsUpserted,
    matchesUpserted,
    matchesSkipped,
    totalTeams: seenTeams.size,
    totalMatches: matches.length,
  };
}
