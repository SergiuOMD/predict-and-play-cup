import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const API_BASE = "https://api.football-data.org/v4";

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

type ApiMatch = {
  id: number;
  status: string;
  score: { fullTime: { home: number | null; away: number | null } };
};

function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function mapStatus(apiStatus: string): string {
  return STATUS_MAP[apiStatus] ?? "scheduled";
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

  const [{ data: batch3h }, { data: batch4h }] = await Promise.all([
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
  ]);

  let updated3h = 0;
  let updated4h = 0;
  let withFinalScores = 0;

  const apply = async (dbId: string, extId: string) => {
    const api = apiMap.get(extId);
    if (!api) return false;
    const home = api.score.fullTime.home;
    const away = api.score.fullTime.away;
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
    if (await apply(m.id, m.external_id)) updated3h++;
    await supabase.from("matches").update({ auto_score_sync_3h_at: now }).eq("id", m.id);
  }

  for (const m of batch4h ?? []) {
    if (!m.external_id) continue;
    if (await apply(m.id, m.external_id)) updated4h++;
    await supabase.from("matches").update({ auto_score_sync_4h_at: now }).eq("id", m.id);
  }

  const result = {
    attempted3h: batch3h?.length ?? 0,
    attempted4h: batch4h?.length ?? 0,
    updated3h,
    updated4h,
    withFinalScores,
    message: `Verificare auto: ${updated3h}/${batch3h?.length ?? 0} @3h, ${updated4h}/${batch4h?.length ?? 0} @4h.`,
  };

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});
