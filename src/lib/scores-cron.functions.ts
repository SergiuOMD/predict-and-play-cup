import { createServerFn } from "@tanstack/react-start";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAutoScoreSync } from "@/lib/football-data/auto-scores-sync.server";

export const runAutoScoreSyncCron = createServerFn({ method: "POST" })
  .inputValidator((data: { secret?: string } | undefined) => data ?? {})
  .handler(async ({ data }) => {
    const expected = process.env.CRON_SECRET;
    if (!expected || data.secret !== expected) {
      throw new Error("Unauthorized");
    }
    return runAutoScoreSync(supabaseAdmin);
  });

export const runAutoScoreSyncAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("is_admin");
    if (error) throw new Error(error.message);
    if (!isAdmin) throw new Error("Acces interzis (doar admin)");
    return runAutoScoreSync(supabaseAdmin);
  });
