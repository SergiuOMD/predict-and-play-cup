import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

import { fetchWorldCupMatches } from "./client.server";
import { mapGroupLetter, mapStage, mapStatus } from "./mappers";
import { apiScoreForPoints, isKnockoutApiStage, shouldPreserveScores } from "./score-api";
import type { FootballDataMatch, FootballDataTeam } from "./types";
import { resolveFlagEmoji } from "@/lib/team-flags";

type DbClient = SupabaseClient<Database>;
type MatchStage = Database["public"]["Enums"]["match_stage"];

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

  const flagEmoji = resolveFlagEmoji(team.tla, team.name);

  if (byExternal) {
    await supabase
      .from("teams")
      .update({
        name: team.name,
        code: team.tla,
        flag_emoji: flagEmoji,
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
        flag_emoji: flagEmoji,
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
      flag_emoji: flagEmoji,
      group_letter: groupLetter,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Echipă ${team.name}: ${error.message}`);

  cache.set(extId, inserted.id);
  return inserted.id;
}

function buildMatchMeta(
  match: FootballDataMatch,
  teamCache: Map<string, string>,
  groupLetter: string | null,
  stage: MatchStage,
) {
  let homeTeamId: string | null = null;
  let awayTeamId: string | null = null;

  if (match.homeTeam.id != null && match.homeTeam.name) {
    homeTeamId = teamCache.get(String(match.homeTeam.id)) ?? null;
  }
  if (match.awayTeam.id != null && match.awayTeam.name) {
    awayTeamId = teamCache.get(String(match.awayTeam.id)) ?? null;
  }

  return {
    external_id: String(match.id),
    kickoff_at: match.utcDate,
    stage,
    status: mapStatus(match.status),
    group_letter: groupLetter,
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    home_team_label: homeTeamId ? null : (match.homeTeam.name ?? match.homeTeam.shortName),
    away_team_label: awayTeamId ? null : (match.awayTeam.name ?? match.awayTeam.shortName),
  };
}

async function upsertMatch(
  supabase: DbClient,
  match: FootballDataMatch,
  teamCache: Map<string, string>,
): Promise<"upserted" | "skipped"> {
  const extId = String(match.id);
  const groupLetter = mapGroupLetter(match.group);
  const stage = mapStage(match.stage);
  const isKnockout = isKnockoutApiStage(match.stage);
  const apiScores = apiScoreForPoints(match);

  if (match.homeTeam.id != null && match.homeTeam.name) {
    await upsertTeam(supabase, match.homeTeam, groupLetter, teamCache);
  }
  if (match.awayTeam.id != null && match.awayTeam.name) {
    await upsertTeam(supabase, match.awayTeam, groupLetter, teamCache);
  }

  const meta = buildMatchMeta(match, teamCache, groupLetter, stage);

  const { data: existing } = await supabase
    .from("matches")
    .select("id, stage, score_locked, home_score, away_score")
    .eq("external_id", extId)
    .maybeSingle();

  if (existing) {
    const preserve = shouldPreserveScores(stage, existing.score_locked);
    const payload = preserve
      ? meta
      : {
          ...meta,
          home_score: apiScores.home,
          away_score: apiScores.away,
        };

    const { error } = await supabase.from("matches").update(payload).eq("id", existing.id);
    if (error) throw new Error(`Meci ${extId}: ${error.message}`);
    return "upserted";
  }

  const insertPayload = isKnockout
    ? { ...meta, home_score: null, away_score: null }
    : { ...meta, home_score: apiScores.home, away_score: apiScores.away };

  const { error } = await supabase.from("matches").insert(insertPayload);
  if (error) throw new Error(`Meci ${extId}: ${error.message}`);
  return "upserted";
}

export async function syncFootballDataFromMatches(
  supabase: DbClient,
  matches: FootballDataMatch[],
): Promise<SyncResult> {
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

export async function syncFootballDataToSupabase(supabase: DbClient): Promise<SyncResult> {
  const { matches } = await fetchWorldCupMatches();
  return syncFootballDataFromMatches(supabase, matches);
}
