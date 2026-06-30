import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const API_BASE = "https://api.football-data.org/v4";

const STAGE_MAP: Record<string, string> = {
  GROUP_STAGE: "group",
  LAST_32: "r32",
  LAST_16: "r16",
  QUARTER_FINALS: "qf",
  SEMI_FINALS: "sf",
  THIRD_PLACE: "third_place",
  FINAL: "final",
};

const STATUS_MAP: Record<string, string> = {
  SCHEDULED: "scheduled",
  TIMED: "scheduled",
  IN_PLAY: "live",
  PAUSED: "live",
  FINISHED: "finished",
  POSTPONED: "postponed",
  SUSPENDED: "postponed",
  CANCELLED: "postponed",
};

type ApiTeam = {
  id: number | null;
  name: string | null;
  shortName: string | null;
  tla: string | null;
};

type ApiMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  homeTeam: ApiTeam;
  awayTeam: ApiTeam;
  score: {
    duration?: string | null;
    fullTime: { home: number | null; away: number | null };
    regularTime?: { home: number | null; away: number | null } | null;
  };
};

function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function mapStage(apiStage: string): string {
  return STAGE_MAP[apiStage] ?? "group";
}

function mapStatus(apiStatus: string): string {
  return STATUS_MAP[apiStatus] ?? "scheduled";
}

function mapGroupLetter(apiGroup: string | null): string | null {
  if (!apiGroup?.startsWith("GROUP_")) return null;
  return apiGroup.replace("GROUP_", "");
}

function apiScoreForPoints(match: ApiMatch): { home: number | null; away: number | null } {
  const regular = match.score.regularTime;
  if (regular && (regular.home != null || regular.away != null)) {
    return { home: regular.home, away: regular.away };
  }
  return { home: match.score.fullTime.home, away: match.score.fullTime.away };
}

function shouldPreserveScores(stage: string, scoreLocked: boolean): boolean {
  return scoreLocked || stage !== "group";
}

function shouldAutoSyncScores(stage: string, scoreLocked: boolean): boolean {
  return stage === "group" && !scoreLocked;
}

async function upsertTeamMinimal(
  supabase: ReturnType<typeof createClient>,
  team: ApiTeam,
  groupLetter: string | null,
  cache: Map<string, string>,
): Promise<string | null> {
  if (team.id == null || !team.name) return null;
  const extId = String(team.id);
  if (cache.has(extId)) return cache.get(extId)!;

  const { data: byExternal } = await supabase
    .from("teams")
    .select("id")
    .eq("external_id", extId)
    .maybeSingle();

  if (byExternal) {
    await supabase
      .from("teams")
      .update({ name: team.name, code: team.tla, group_letter: groupLetter })
      .eq("id", byExternal.id);
    cache.set(extId, byExternal.id);
    return byExternal.id;
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

  if (error) throw error;
  cache.set(extId, inserted.id);
  return inserted.id;
}

async function syncSchedule(
  supabase: ReturnType<typeof createClient>,
  apiMatches: ApiMatch[],
): Promise<number> {
  const teamCache = new Map<string, string>();
  let upserted = 0;

  for (const match of apiMatches) {
    const groupLetter = mapGroupLetter(match.group);
    for (const team of [match.homeTeam, match.awayTeam]) {
      if (team.id != null && team.name) {
        await upsertTeamMinimal(supabase, team, groupLetter, teamCache);
      }
    }
  }

  for (const match of apiMatches) {
    const extId = String(match.id);
    const stage = mapStage(match.stage);
    const groupLetter = mapGroupLetter(match.group);
    const isKnockout = match.stage !== "GROUP_STAGE";
    const apiScores = apiScoreForPoints(match);

    let homeTeamId: string | null = null;
    let awayTeamId: string | null = null;
    if (match.homeTeam.id != null) homeTeamId = teamCache.get(String(match.homeTeam.id)) ?? null;
    if (match.awayTeam.id != null) awayTeamId = teamCache.get(String(match.awayTeam.id)) ?? null;

    const meta = {
      external_id: extId,
      kickoff_at: match.utcDate,
      stage,
      status: mapStatus(match.status),
      group_letter: groupLetter,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      home_team_label: homeTeamId ? null : (match.homeTeam.name ?? match.homeTeam.shortName),
      away_team_label: awayTeamId ? null : (match.awayTeam.name ?? match.awayTeam.shortName),
    };

    const { data: existing } = await supabase
      .from("matches")
      .select("id, score_locked")
      .eq("external_id", extId)
      .maybeSingle();

    if (existing) {
      const preserve = shouldPreserveScores(stage, existing.score_locked);
      const payload = preserve
        ? meta
        : { ...meta, home_score: apiScores.home, away_score: apiScores.away };
      await supabase.from("matches").update(payload).eq("id", existing.id);
    } else {
      const payload = isKnockout
        ? { ...meta, home_score: null, away_score: null }
        : { ...meta, home_score: apiScores.home, away_score: apiScores.away };
      await supabase.from("matches").insert(payload);
    }
    upserted++;
  }

  return upserted;
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const auth = req.headers.get("Authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const footballToken = Deno.env.get("FOOTBALL_DATA_API_TOKEN");

  if (!supabaseUrl || !serviceKey || !footballToken) {
    return new Response(JSON.stringify({ error: "Missing env vars" }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const now = new Date().toISOString();
  const threeHoursAgo = hoursAgoIso(3);
  const fourHoursAgo = hoursAgoIso(4);

  const apiRes = await fetch(`${API_BASE}/competitions/WC/matches?season=2026&limit=200`, {
    headers: { "X-Auth-Token": footballToken },
  });

  if (!apiRes.ok) {
    const body = await apiRes.text();
    return new Response(JSON.stringify({ error: `football-data ${apiRes.status}: ${body}` }), {
      status: 502,
    });
  }

  const apiData = await apiRes.json() as { matches: ApiMatch[] };
  const apiMap = new Map(apiData.matches.map((m) => [String(m.id), m]));
  const scheduleUpserted = await syncSchedule(supabase, apiData.matches);

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

  const apply = async (dbId: string, extId: string, stage: string, scoreLocked: boolean) => {
    if (!shouldAutoSyncScores(stage, scoreLocked)) {
      skippedKnockoutOrLocked++;
      return false;
    }
    const api = apiMap.get(extId);
    if (!api) return false;
    const { home, away } = apiScoreForPoints(api);
    const { error } = await supabase
      .from("matches")
      .update({
        home_score: home,
        away_score: away,
        status: mapStatus(api.status),
        updated_at: now,
      })
      .eq("id", dbId);
    if (error) throw error;
    if (home != null && away != null) withFinalScores++;
    return true;
  };

  for (const m of batch3h ?? []) {
    if (!m.external_id) continue;
    if (await apply(m.id, m.external_id, m.stage, m.score_locked)) updated3h++;
    await supabase.from("matches").update({ auto_score_sync_3h_at: now }).eq("id", m.id);
  }

  for (const m of batch4h ?? []) {
    if (!m.external_id) continue;
    if (await apply(m.id, m.external_id, m.stage, m.score_locked)) updated4h++;
    await supabase.from("matches").update({ auto_score_sync_4h_at: now }).eq("id", m.id);
  }

  const result = {
    scheduleUpserted,
    totalApiMatches: apiData.matches.length,
    attempted3h: batch3h?.length ?? 0,
    attempted4h: batch4h?.length ?? 0,
    updated3h,
    updated4h,
    skippedKnockoutOrLocked,
    withFinalScores,
    message:
      `Program: ${scheduleUpserted}/${apiData.matches.length} meciuri. ` +
      `Scoruri auto (doar grupe): ${updated3h}/${batch3h?.length ?? 0} @3h, ${updated4h}/${batch4h?.length ?? 0} @4h.`,
  };

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});
