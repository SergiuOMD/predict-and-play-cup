import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/page-header";
import { Medal, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

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
  head: () => ({ meta: [{ title: "Clasament · ORBICO WC2026" }] }),
  component: LeaderboardPage,
});

const PODIUM_STYLES = [
  { ring: "ring-[var(--accent-gold)]/60", bg: "bg-gradient-to-b from-[#fff8e6] to-white", medal: "🥇", height: "sm:pt-0" },
  { ring: "ring-[var(--wc-light-gray)]", bg: "bg-gradient-to-b from-[#f0f0f0] to-white", medal: "🥈", height: "sm:pt-6" },
  { ring: "ring-[#cd7f32]/40", bg: "bg-gradient-to-b from-[#fdf0e6] to-white", medal: "🥉", height: "sm:pt-10" },
];

function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("leaderboard").select("*");
    const sorted = ((data ?? []) as Row[]).sort(
      (a, b) => b.total_points - a.total_points || b.predictions_count - a.predictions_count,
    );
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

  const top3 = rows.slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clasament"
        description="Puncte din meciuri + predicții bonus. Actualizare live."
        icon={<Medal className="h-5 w-5 text-white" />}
      />

      {rows.length === 0 ? (
        <div className="app-card p-10 text-center">
          <Trophy className="mx-auto h-12 w-12 text-[var(--wc-hermes)]/30" />
          <p className="mt-4 text-muted-foreground">Niciun participant încă.</p>
        </div>
      ) : (
        <>
          {top3.length > 0 && (
            <div
              className={cn(
                "grid grid-cols-1 gap-4 sm:items-end",
                top3.length === 1 && "sm:grid-cols-1 sm:max-w-xs sm:mx-auto",
                top3.length === 2 && "sm:grid-cols-2",
                top3.length >= 3 && "sm:grid-cols-3",
              )}
            >
              {top3.map((r, idx) => {
                const style = PODIUM_STYLES[idx];
                return (
                  <div
                    key={r.user_id}
                    className={cn(
                      "app-card flex flex-col items-center p-5 text-center ring-2",
                      style.bg,
                      style.ring,
                      style.height,
                      r.user_id === me && "ring-[var(--wc-green)]",
                    )}
                  >
                    <span className="text-3xl">{style.medal}</span>
                    <Avatar className="mt-2 h-14 w-14 ring-2 ring-white">
                      <AvatarImage src={r.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-[var(--wc-hermes)] text-white">
                        {r.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="mt-2 font-bold">{r.display_name}</p>
                    <p className="text-2xl font-black text-[var(--wc-hermes)]">{r.total_points}</p>
                    <p className="text-xs text-muted-foreground">puncte</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="app-card overflow-hidden">
            <div className="border-b bg-[var(--wc-hermes)]/5 px-5 py-3">
              <h2 className="flex items-center gap-2 font-bold text-[var(--wc-hermes)]">
                <Trophy className="h-4 w-4" /> Clasament complet
              </h2>
            </div>
            <ol className="divide-y">
              {rows.map((r, i) => (
                <li
                  key={r.user_id}
                  className={cn(
                    "flex items-center gap-3 px-5 py-4 transition-colors",
                    r.user_id === me && "bg-[var(--wc-green)]/8",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black",
                      i < 3 ? "bg-[var(--wc-hermes)] text-white" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {i + 1}
                  </span>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={r.avatar_url ?? undefined} />
                    <AvatarFallback>{r.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">
                      {r.display_name}
                      {r.user_id === me && (
                        <span className="ml-2 text-xs font-medium text-[var(--wc-green)]">(tu)</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.match_points} meciuri · {r.champion_points + r.top_scorer_points} bonus
                    </div>
                  </div>
                  <Badge className="shrink-0 bg-[var(--wc-hermes)] text-base font-bold hover:bg-[var(--wc-hermes)]">
                    {r.total_points}
                  </Badge>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
