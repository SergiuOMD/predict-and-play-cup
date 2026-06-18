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
  guessed_scores: number;
  predicted_scores: number;
  matches_predicted: number;
};

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Clasament · ORBICO WC2026" }] }),
  component: LeaderboardPage,
});

function sortLeaderboard(rows: Row[]): Row[] {
  return [...rows].sort(
    (a, b) =>
      b.total_points - a.total_points
      || b.matches_predicted - a.matches_predicted
      || b.guessed_scores - a.guessed_scores,
  );
}

function normalizeRow(row: Record<string, unknown>): Row {
  const matches = Number(row.matches_predicted ?? row.predictions_count ?? 0);
  const guessed = Number(row.guessed_scores ?? row.match_points ?? 0);
  const predicted = Number(row.predicted_scores ?? matches * 3);
  return {
    user_id: String(row.user_id),
    display_name: String(row.display_name ?? "Participant"),
    avatar_url: (row.avatar_url as string | null) ?? null,
    match_points: Number(row.match_points ?? 0),
    champion_points: Number(row.champion_points ?? 0),
    top_scorer_points: Number(row.top_scorer_points ?? 0),
    total_points: Number(row.total_points ?? 0),
    guessed_scores: guessed,
    predicted_scores: predicted,
    matches_predicted: matches,
  };
}

function accuracyPercent(guessed: number, predicted: number): number | null {
  if (predicted <= 0) return null;
  return Math.round((guessed / predicted) * 100);
}

function LeaderboardStats({ row, compact = false }: { row: Row; compact?: boolean }) {
  const pct = accuracyPercent(row.guessed_scores, row.predicted_scores);
  const bonus = row.champion_points + row.top_scorer_points;

  return (
    <div className={cn("space-y-0.5 text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
      <p>
        Scoruri ghicite: <span className="font-medium text-foreground">{row.guessed_scores}</span>
        {" · "}
        Scoruri prognozate: <span className="font-medium text-foreground">{row.predicted_scores}</span>
      </p>
      <p>
        Meciuri prognozate: <span className="font-medium text-foreground">{row.matches_predicted}</span>
        {pct !== null && (
          <>
            {" · "}
            Rată:{" "}
            <span className="font-medium text-[var(--wc-hermes)]">
              {pct}% ({row.guessed_scores}/{row.predicted_scores})
            </span>
          </>
        )}
      </p>
      {bonus > 0 && (
        <p className="text-[10px] opacity-80">
          {row.match_points} pct meciuri · {bonus} pct bonus
        </p>
      )}
    </div>
  );
}

const PODIUM_STYLES = [
  {
    ring: "ring-[var(--accent-gold)]/70",
    bg: "bg-gradient-to-b from-[#fff8e6] to-white",
    medal: "🥇",
    card: "p-6 sm:p-7 shadow-[var(--shadow-elegant)]",
    avatar: "h-16 w-16",
    score: "text-3xl",
  },
  {
    ring: "ring-[var(--wc-light-gray)]",
    bg: "bg-gradient-to-b from-[#f0f0f0] to-white",
    medal: "🥈",
    card: "p-5",
    avatar: "h-12 w-12",
    score: "text-xl",
  },
  {
    ring: "ring-[#cd7f32]/40",
    bg: "bg-gradient-to-b from-[#fdf0e6] to-white",
    medal: "🥉",
    card: "p-5",
    avatar: "h-12 w-12",
    score: "text-xl",
  },
];

function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("leaderboard").select("*");
    setRows(sortLeaderboard((data ?? []).map((r) => normalizeRow(r as Record<string, unknown>))));
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
        description="Puncte totale, apoi meciuri prognozate la egalitate. Sub fiecare nume vezi scorurile ghicite vs prognozate."
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
                "grid grid-cols-1 gap-4 sm:items-stretch",
                top3.length === 1 && "sm:mx-auto sm:max-w-sm sm:grid-cols-1",
                top3.length === 2 && "sm:grid-cols-[1.15fr_1fr]",
                top3.length >= 3 && "sm:grid-cols-[1.15fr_1fr_1fr]",
              )}
            >
              {top3.map((r, idx) => {
                const style = PODIUM_STYLES[idx];
                return (
                  <div
                    key={r.user_id}
                    className={cn(
                      "app-card flex flex-col items-center text-center ring-2",
                      style.bg,
                      style.ring,
                      style.card,
                      r.user_id === me && "ring-[var(--wc-green)]",
                    )}
                  >
                    <span className={cn("leading-none", idx === 0 ? "text-4xl" : "text-2xl")}>{style.medal}</span>
                    <Avatar className={cn("mt-2 ring-2 ring-white", style.avatar)}>
                      <AvatarImage src={r.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-[var(--wc-hermes)] text-white">
                        {r.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className={cn("mt-2 font-bold", idx === 0 && "text-base")}>{r.display_name}</p>
                    <p className={cn("font-black text-[var(--wc-hermes)]", style.score)}>{r.total_points}</p>
                    <p className="text-xs text-muted-foreground">puncte</p>
                    <div className="mt-3 w-full text-left">
                      <LeaderboardStats row={r} compact />
                    </div>
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
              <p className="mt-1 text-xs text-muted-foreground">
                Departajare: puncte totale → meciuri prognozate
              </p>
            </div>
            <ol className="divide-y">
              {rows.map((r, i) => (
                <li
                  key={r.user_id}
                  className={cn(
                    "flex items-start gap-3 px-5 py-4 transition-colors sm:items-center",
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
                  <Avatar className="h-9 w-9 shrink-0">
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
                    <LeaderboardStats row={r} />
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
