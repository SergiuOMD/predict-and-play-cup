import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import type { PlayerImportRow } from "@/lib/players-import";
import { normalizePlayerName } from "@/lib/players-import";

type DbClient = SupabaseClient<Database>;

export type ManualImportResult = {
  playersUpserted: number;
  skipped: number;
};

async function resolveTeamIdForImport(
  supabase: DbClient,
  row: PlayerImportRow,
  cache: Map<string, string | null>,
): Promise<string | null> {
  const key = `${row.team_code ?? ""}|${row.team ?? ""}`.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  let teamId: string | null = null;

  if (row.team_code) {
    const { data } = await supabase
      .from("teams")
      .select("id")
      .ilike("code", row.team_code.trim())
      .maybeSingle();
    teamId = data?.id ?? null;
  }

  if (!teamId && row.team) {
    const { data } = await supabase
      .from("teams")
      .select("id")
      .ilike("name", row.team.trim())
      .maybeSingle();
    teamId = data?.id ?? null;
  }

  cache.set(key, teamId);
  return teamId;
}

export async function upsertPlayersFromRows(
  supabase: DbClient,
  rows: PlayerImportRow[],
): Promise<ManualImportResult> {
  const teamCache = new Map<string, string | null>();
  let playersUpserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = normalizePlayerName(row.name);
    if (!name) {
      skipped++;
      continue;
    }

    const teamId = await resolveTeamIdForImport(supabase, row, teamCache);
    const payload = {
      team_id: teamId,
      name,
      position: row.position ?? null,
      nationality: row.nationality ?? null,
      shirt_number: row.shirt_number ?? null,
      updated_at: new Date().toISOString(),
    };

    if (teamId) {
      const { data: existing } = await supabase
        .from("players")
        .select("id")
        .eq("team_id", teamId)
        .ilike("name", name)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("players").update(payload).eq("id", existing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("players").insert(payload);
        if (error) throw new Error(error.message);
      }
    } else {
      const { data: existing } = await supabase
        .from("players")
        .select("id")
        .is("team_id", null)
        .ilike("name", name)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("players").update(payload).eq("id", existing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("players").insert(payload);
        if (error) throw new Error(error.message);
      }
    }
    playersUpserted++;
  }

  return { playersUpserted, skipped };
}
