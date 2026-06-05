import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { syncPlayersFromFootballData } from "@/lib/football-data/players-sync.server";
import { parsePlayersFile } from "@/lib/players-import";
import { upsertPlayersFromRows } from "@/lib/players-upsert.server";

async function requireAdmin(supabase: Parameters<typeof syncPlayersFromFootballData>[0]) {
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Acces interzis (doar admin)");
}

export const importPlayersFromApi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase);
    return syncPlayersFromFootballData(context.supabase);
  });

export const importPlayersFromFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { content: string; format: "csv" | "json" }) => {
    if (!data?.content?.trim()) throw new Error("Fișierul este gol");
    if (data.format !== "csv" && data.format !== "json") throw new Error("Format invalid");
    return data;
  })
  .handler(async ({ context, data }) => {
    await requireAdmin(context.supabase);
    const rows = parsePlayersFile(data.content, data.format);
    const result = await upsertPlayersFromRows(context.supabase, rows);
    return {
      ...result,
      message: `Importate ${result.playersUpserted} jucători${result.skipped ? `, ${result.skipped} ignorate` : ""}.`,
    };
  });
