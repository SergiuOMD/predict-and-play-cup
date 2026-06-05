import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

type Row = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  match_points: number;
  champion_points: number;
  top_scorer_points: number;
  total_points: number;
  predictions_count: number;
};

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Clasament · OMD WC2026" }] }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("leaderboard").select("*");
    const sorted = ((data ?? []) as Row[]).sort((a, b) => b.total_points - a.total_points || b.predictions_count - a.predictions_count);
    setRows(sorted);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
    load();
    const ch = supabase.channel("lb")
      .on("postgres_changes", { event: "*", schema: "public", table: "predictions" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "tournament_settings" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Clasament</h1>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Top participanți</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-center text-muted-foreground">Nimeni încă.</p>
          ) : (
            <ol className="space-y-2">
              {rows.map((r, i) => (
                <li key={r.user_id} className={`flex items-center gap-3 rounded-lg border p-3 ${r.user_id === me ? "border-primary bg-primary/5" : ""}`}>
                  <span className="w-8 text-center text-lg font-bold tabular-nums">{i + 1}</span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={r.avatar_url ?? undefined} />
                    <AvatarFallback>{r.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{r.display_name}{r.user_id === me && <span className="ml-2 text-xs text-muted-foreground">(tu)</span>}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.match_points} meciuri · {r.champion_points + r.top_scorer_points} bonus · {r.predictions_count} pronosticuri
                    </div>
                  </div>
                  <Badge className="text-base">{r.total_points} pct</Badge>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
