import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type FDTeam = { id: number; name: string; tla: string | null; crest: string | null };
type FDMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  homeTeam: { id: number | null; name: string | null; tla: string | null };
  awayTeam: { id: number | null; name: string | null; tla: string | null };
  score: { fullTime: { home: number | null; away: number | null } };
  venue?: string | null;
};

const STAGE_MAP: Record<string, string> = {
  GROUP_STAGE: "group",
  LAST_16: "round_of_16",
  ROUND_OF_16: "round_of_16",
  ROUND_OF_32: "round_of_32",
  QUARTER_FINALS: "quarter_final",
  SEMI_FINALS: "semi_final",
  THIRD_PLACE: "third_place",
  FINAL: "final",
};

const STATUS_MAP: Record<string, "scheduled" | "live" | "finished" | "postponed"> = {
  SCHEDULED: "scheduled",
  TIMED: "scheduled",
  IN_PLAY: "live",
  PAUSED: "live",
  FINISHED: "finished",
  POSTPONED: "postponed",
  SUSPENDED: "postponed",
  CANCELLED: "postponed",
};

export const importFixtures = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const token = process.env.FOOTBALL_DATA_API_TOKEN;
    if (!token) throw new Error("FOOTBALL_DATA_API_TOKEN nu este setat");

    const email = (context.claims?.email as string | undefined)?.toLowerCase();
    if (!email) throw new Error("Neautentificat");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Verify admin
    const { data: adminRow } = await supabaseAdmin
      .from("admins").select("email").ilike("email", email).maybeSingle();
    if (!adminRow) throw new Error("Acces interzis (doar admin)");

    const headers = { "X-Auth-Token": token };

    // Fetch teams + matches for World Cup 2026 (code: WC)
    const [teamsRes, matchesRes] = await Promise.all([
      fetch("https://api.football-data.org/v4/competitions/WC/teams", { headers }),
      fetch("https://api.football-data.org/v4/competitions/WC/matches", { headers }),
    ]);

    if (!teamsRes.ok) {
      const txt = await teamsRes.text();
      throw new Error(`football-data.org teams: ${teamsRes.status} ${txt.slice(0, 200)}`);
    }
    if (!matchesRes.ok) {
      const txt = await matchesRes.text();
      throw new Error(`football-data.org matches: ${matchesRes.status} ${txt.slice(0, 200)}`);
    }

    const teamsJson = (await teamsRes.json()) as { teams: FDTeam[] };
    const matchesJson = (await matchesRes.json()) as { matches: FDMatch[] };

    // Upsert teams keyed by code (TLA)
    let teamsUpserted = 0;
    const teamIdByExt = new Map<number, string>();
    const teamIdByCode = new Map<string, string>();

    for (const t of teamsJson.teams ?? []) {
      const code = t.tla ?? null;
      if (!t.name) continue;
      const payload = { name: t.name, code, flag_emoji: null as string | null };
      // try find existing by code
      let existing: { id: string } | null = null;
      if (code) {
        const { data } = await supabaseAdmin.from("teams").select("id").eq("code", code).maybeSingle();
        existing = data;
      }
      if (!existing) {
        const { data } = await supabaseAdmin.from("teams").select("id").eq("name", t.name).maybeSingle();
        existing = data;
      }
      let id: string;
      if (existing) {
        await supabaseAdmin.from("teams").update(payload).eq("id", existing.id);
        id = existing.id;
      } else {
        const { data, error } = await supabaseAdmin.from("teams").insert(payload).select("id").single();
        if (error) continue;
        id = data.id;
      }
      teamIdByExt.set(t.id, id);
      if (code) teamIdByCode.set(code, id);
      teamsUpserted++;
    }

    // Upsert matches keyed by external id stored in venue? We need a stable key.
    // Use (kickoff_at, home_team_label, away_team_label) heuristic via name+date.
    let matchesUpserted = 0;
    for (const m of matchesJson.matches ?? []) {
      const stage = STAGE_MAP[m.stage] ?? "group";
      const status = STATUS_MAP[m.status] ?? "scheduled";
      const homeId = m.homeTeam.id ? teamIdByExt.get(m.homeTeam.id) : undefined;
      const awayId = m.awayTeam.id ? teamIdByExt.get(m.awayTeam.id) : undefined;
      const homeLabel = m.homeTeam.name ?? "TBD";
      const awayLabel = m.awayTeam.name ?? "TBD";
      const group = m.group ? m.group.replace(/^GROUP_/, "").slice(0, 1) : null;

      const payload = {
        kickoff_at: m.utcDate,
        status,
        stage: stage as "group",
        group_letter: group,
        home_team_id: homeId ?? null,
        away_team_id: awayId ?? null,
        home_team_label: homeLabel,
        away_team_label: awayLabel,
        home_score: m.score?.fullTime?.home ?? null,
        away_score: m.score?.fullTime?.away ?? null,
        venue: m.venue ?? null,
      };

      // Match heuristic: same kickoff + labels
      const { data: existing } = await supabaseAdmin
        .from("matches")
        .select("id")
        .eq("kickoff_at", payload.kickoff_at)
        .eq("home_team_label", homeLabel)
        .eq("away_team_label", awayLabel)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin.from("matches").update(payload).eq("id", existing.id);
      } else {
        const { error } = await supabaseAdmin.from("matches").insert(payload);
        if (error) continue;
      }
      matchesUpserted++;
    }

    return {
      teamsUpserted,
      matchesUpserted,
      totalTeams: teamsJson.teams?.length ?? 0,
      totalMatches: matchesJson.matches?.length ?? 0,
    };
  });
