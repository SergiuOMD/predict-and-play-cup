import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

import { fetchWorldCupMatches } from "./client.server";
import { mapStatus } from "./mappers";
import type { FootballDataMatch } from "./types";

type DbClient = SupabaseClient<Database>;

export type AutoScoreSyncResult = {
  attempted3h: number;
  attempted4h: number;
  updated3h: number;
  updated4h: number;
  withFinalScores: number;
  message: string;
};

function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function apiMatchMap(matches: FootballDataMatch[]): Map<string, FootballDataMatch> {
  return new Map(matches.map((m) => [String(m.id), m]));
}

async function applyApiScore(
  supabase: DbClient,
  dbMatchId: string,
  api: FootballDataMatch,
): Promise<boolean> {
  const home = api.score.fullTime.home;
  const away = api.score.fullTime.away;

  const { error } = await supabase
    .from("matches")
    .update({
      home_score: home,
      away_score: away,
      status: mapStatus(api.status),
      updated_at: new Date().toISOString(),
    })
    .eq("id", dbMatchId);

  if (error) throw new Error(error.message);
  return home != null && away != null;
}

export async function runAutoScoreSync(supabase: DbClient): Promise<AutoScoreSyncResult> {
  const now = new Date().toISOString();
  const threeHoursAgo = hoursAgoIso(3);
  const fourHoursAgo = hoursAgoIso(4);

  const [{ data: batch3h }, { data: batch4h }, { matches: apiMatches }] = await Promise.all([
    supabase
      .from("matches")
      .select("id,external_id")
      .not("external_id", "is", null)
      .is("auto_score_sync_3h_at", null)
      .lte("kickoff_at", threeHoursAgo),
    supabase
      .from("matches")
      .select("id,external_id")
      .not("external_id", "is", null)
      .is("auto_score_sync_4h_at", null)
      .lte("kickoff_at", fourHoursAgo),
    fetchWorldCupMatches(),
  ]);

  const apiMap = apiMatchMap(apiMatches);
  let updated3h = 0;
  let updated4h = 0;
  let withFinalScores = 0;

  for (const m of batch3h ?? []) {
    if (!m.external_id) continue;
    const api = apiMap.get(m.external_id);
    if (api) {
      if (await applyApiScore(supabase, m.id, api)) withFinalScores++;
      updated3h++;
    }
    await supabase.from("matches").update({ auto_score_sync_3h_at: now }).eq("id", m.id);
  }

  for (const m of batch4h ?? []) {
    if (!m.external_id) continue;
    const api = apiMap.get(m.external_id);
    if (api) {
      if (await applyApiScore(supabase, m.id, api)) withFinalScores++;
      updated4h++;
    }
    await supabase.from("matches").update({ auto_score_sync_4h_at: now }).eq("id", m.id);
  }

  return {
    attempted3h: batch3h?.length ?? 0,
    attempted4h: batch4h?.length ?? 0,
    updated3h,
    updated4h,
    withFinalScores,
    message: `Verificare auto: ${updated3h}/${batch3h?.length ?? 0} meciuri @3h, ${updated4h}/${batch4h?.length ?? 0} @4h (${withFinalScores} cu scor final).`,
  };
}
