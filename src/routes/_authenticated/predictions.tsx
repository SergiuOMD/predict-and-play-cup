import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/page-header";
import { TeamFlag } from "@/components/app/team-flag";
import { Badge } from "@/components/ui/badge";
import { isMatchOpen } from "@/lib/match-utils";
import { ClipboardList, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Match = {
  id: string;
  kickoff_at: string;
  status: string;
  group_letter: string | null;
  home_score: number | null;
  away_score: number | null;
  home_team_label: string | null;
  away_team_label: string | null;
  home_team: { name: string; code: string | null; flag_emoji: string | null } | null;
  away_team: { name: string; code: string | null; flag_emoji: string | null } | null;
};

type Prediction = {
  id: string;
  match_id: string;
  score1_home: number;
  score1_away: number;
  score2_home: number;
  score2_away: number;
  score3_home: number;
  score3_away: number;
  updated_at: string;
};

export const Route = createFileRoute("/_authenticated/predictions")({
  head: () => ({ meta: [{ title: "Pronosticuri · ORBICO WC2026" }] }),
  component: PredictionsPage,
});

function formatScores(p: Prediction) {
  return [
    `${p.score1_home}-${p.score1_away}`,
    `${p.score2_home}-${p.score2_away}`,
    `${p.score3_home}-${p.score3_away}`,
  ].join(" · ");
}

function PredictionsPage() {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id ?? null;
    setUserId(uid);

    const { data: allMatches } = await supabase
      .from("matches")
      .select("id,kickoff_at,status,group_letter,home_score,away_score,home_team_label,away_team_label,home_team:teams!matches_home_team_id_fkey(name,code,flag_emoji),away_team:teams!matches_away_team_id_fkey(name,code,flag_emoji)")
      .order("kickoff_at", { ascending: true });

    const open = ((allMatches ?? []) as unknown as Match[]).filter((m) =>
      isMatchOpen(m.status, m.kickoff_at, m.home_score),
    );
    setMatches(open);

    if (uid && open.length > 0) {
      const { data: preds } = await supabase
        .from("predictions")
        .select("id,match_id,score1_home,score1_away,score2_home,score2_away,score3_home,score3_away,updated_at")
        .eq("user_id", uid)
        .in("match_id", open.map((m) => m.id));
      setPredictions((preds ?? []) as Prediction[]);
    } else {
      setPredictions([]);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("predictions-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "predictions" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const predByMatch = useMemo(
    () => new Map(predictions.map((p) => [p.match_id, p])),
    [predictions],
  );

  if (matches === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  const predictedCount = matches.filter((m) => predByMatch.has(m.id)).length;
  const missingCount = matches.length - predictedCount;

  const groups = matches.reduce<Record<string, Match[]>>((acc, m) => {
    const d = new Date(m.kickoff_at).toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" });
    (acc[d] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pronosticuri active"
        description="Meciurile deschise încă pentru pronostic și predicțiile tale curente."
        icon={<ClipboardList className="h-5 w-5 text-white" />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Meciuri deschise" value={matches.length} accent="hermes" />
        <StatCard label="Pronosticate" value={predictedCount} accent="green" />
        <StatCard label="De completat" value={missingCount} accent="red" />
      </div>

      {matches.length === 0 ? (
        <div className="app-card p-10 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-[var(--wc-hermes)]/30" />
          <p className="mt-4 font-medium">Niciun meci deschis momentan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Toate meciurile viitoare sunt blocate sau deja jucate.
          </p>
        </div>
      ) : (
        Object.entries(groups).map(([date, list]) => (
          <section key={date} className="app-card overflow-hidden">
            <div className="bg-gradient-hermes px-4 py-2.5 sm:px-5">
              <h2 className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-white/90 sm:text-xs">
                {date}
              </h2>
            </div>
            <ul className="divide-y divide-[var(--wc-light-gray)]">
              {list.map((m) => (
                <PredictionRow
                  key={m.id}
                  match={m}
                  prediction={predByMatch.get(m.id)}
                  userId={userId}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: "hermes" | "green" | "red" }) {
  const colors = {
    hermes: "text-[var(--wc-hermes)] bg-[var(--wc-hermes)]/8 border-[var(--wc-hermes)]/20",
    green: "text-[var(--wc-green)] bg-[#e8f5e8] border-[var(--wc-green)]/25",
    red: "text-[var(--wc-red)] bg-[#fde8e9] border-[var(--wc-red)]/25",
  };
  return (
    <div className={cn("app-card border px-4 py-3", colors[accent])}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}

function PredictionRow({
  match: m,
  prediction,
  userId,
}: {
  match: Match;
  prediction?: Prediction;
  userId: string | null;
}) {
  const homeName = m.home_team?.name ?? m.home_team_label ?? "TBD";
  const awayName = m.away_team?.name ?? m.away_team_label ?? "TBD";
  const time = new Date(m.kickoff_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
  const hasPred = !!prediction;

  return (
    <li>
      <Link
        to="/matches/$id"
        params={{ id: m.id }}
        className="group flex items-stretch transition-colors hover:bg-[var(--wc-hermes)]/[0.04]"
      >
        <div className={cn("w-1 shrink-0", hasPred ? "bg-[var(--wc-green)]" : "bg-[var(--wc-light-gray)]")} aria-hidden />

        <div className="flex min-w-0 flex-1 flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
          <div className="flex shrink-0 items-center gap-2 sm:w-[5.5rem] sm:flex-col sm:items-start sm:gap-1">
            <span className="text-sm font-black tabular-nums text-[var(--wc-hermes)]">{time}</span>
            {m.group_letter && (
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Gr {m.group_letter}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <TeamFlag code={m.home_team?.code} name={homeName} emoji={m.home_team?.flag_emoji} size="sm" />
              <span className="truncate text-sm font-bold">{homeName}</span>
              <span className="text-xs font-bold text-muted-foreground">vs</span>
              <span className="truncate text-sm font-bold">{awayName}</span>
              <TeamFlag code={m.away_team?.code} name={awayName} emoji={m.away_team?.flag_emoji} size="sm" />
            </div>

            {hasPred && prediction ? (
              <p className="mt-1.5 font-mono text-xs text-muted-foreground">
                {formatScores(prediction)}
              </p>
            ) : (
              <p className="mt-1.5 text-xs font-medium text-[var(--wc-red)]">Lipsește pronosticul</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-semibold",
                hasPred
                  ? "border-[var(--wc-green)]/30 bg-[#e8f5e8] text-[#2d7a2c]"
                  : "border-[var(--wc-red)]/30 bg-[#fde8e9] text-[var(--wc-red)]",
              )}
            >
              {hasPred ? "Complet" : "Lipsă"}
            </Badge>
            {hasPred ? (
              <span className="text-[10px] text-muted-foreground">
                {userId ? new Date(prediction!.updated_at).toLocaleDateString("ro-RO") : ""}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[var(--wc-hermes)] group-hover:underline">
              {hasPred ? "Modifică" : "Pronostichează"}
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
