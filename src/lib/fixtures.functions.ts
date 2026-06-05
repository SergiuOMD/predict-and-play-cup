import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { syncFootballDataToSupabase } from "@/lib/football-data/sync.server";

export const importFixtures = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: adminError } = await context.supabase.rpc("is_admin");
    if (adminError) throw new Error(adminError.message);
    if (!isAdmin) throw new Error("Acces interzis (doar admin)");

    return syncFootballDataToSupabase(context.supabase);
  });
