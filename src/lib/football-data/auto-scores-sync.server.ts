import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

import { fetchWorldCupMatches } from "./client.server";
import { mapStatus } from "./mappers";
import { apiScoreForPoints, shouldAutoSyncScores } from "./score-api";
import { syncFootballDataFromMatches } from "./sync.server";
import type { FootballDataMatch } from "./types";

type DbClient = SupabaseClient<Database>;

export type AutoScoreSyncResult = {
  scheduleSync: { matchesUpserted: number; totalMatches: number };
  attempted3h: number;
  attempted4h: number;
  updated3h: number;
  updated4h: number;
  skippedKnockoutOrLocked: number;
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
  const { home, away } = apiScoreForPoints(api);

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

  const { matches: apiMatches } = await fetchWorldCupMatches();
  const scheduleSync = await syncFootballDataFromMatches(supabase, apiMatches);
  const apiMap = apiMatchMap(apiMatches);

  const [{ data: batch3h }, { data: batch4h }] = await Promise.all([
    supabase
      .from("matches")
      .select("id,external_id,stage,score_locked")
      .not("external_id", "is", null)
      .is("auto_score_sync_3h_at", null)
      .lte("kickoff_at", threeHoursAgo),
    supabase
      .from("matches")
      .select("id,external_id,stage,score_locked")
      .not("external_id", "is", null)
      .is("auto_score_sync_4h_at", null)
      .lte("kickoff_at", fourHoursAgo),
  ]);

  let updated3h = 0;
  let updated4h = 0;
  let skippedKnockoutOrLocked = 0;
  let withFinalScores = 0;

  const processBatch = async (
    batch: { id: string; external_id: string | null; stage: string; score_locked: boolean }[] | null,
    markField: "auto_score_sync_3h_at" | "auto_score_sync_4h_at",
    incrementUpdated: () => void,
  ) => {
    for (const m of batch ?? []) {
      if (!m.external_id) continue;

      if (!shouldAutoSyncScores(m.stage, m.score_locked)) {
        skippedKnockoutOrLocked++;
      } else {
        const api = apiMap.get(m.external_id);
        if (api) {
          if (await applyApiScore(supabase, m.id, api)) withFinalScores++;
          incrementUpdated();
        }
      }

      await supabase.from("matches").update({ [markField]: now }).eq("id", m.id);
    }
  };

  await processBatch(batch3h, "auto_score_sync_3h_at", () => { updated3h++; });
  await processBatch(batch4h, "auto_score_sync_4h_at", () => { updated4h++; });

  return {
    scheduleSync: {
      matchesUpserted: scheduleSync.matchesUpserted,
      totalMatches: scheduleSync.totalMatches,
    },
    attempted3h: batch3h?.length ?? 0,
    attempted4h: batch4h?.length ?? 0,
    updated3h,
    updated4h,
    skippedKnockoutOrLocked,
    withFinalScores,
    message:
      `Program: ${scheduleSync.matchesUpserted}/${scheduleSync.totalMatches} meciuri. ` +
      `Scoruri auto (doar grupe): ${updated3h}/${batch3h?.length ?? 0} @3h, ${updated4h}/${batch4h?.length ?? 0} @4h ` +
      `(${withFinalScores} cu scor final, ${skippedKnockoutOrLocked} play-off/blocate sărite).`,
  };
}
