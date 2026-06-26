import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/page-header";
import { MatchPhaseTabs } from "@/components/app/match-phase-tabs";
import { TeamFlag } from "@/components/app/team-flag";
import { formatPredictionScores } from "@/lib/prediction-utils";
import {
  formatKickoffDateShort,
  formatKickoffTime,
  getMatchPhaseLabel,
} from "@/lib/match-stage";
import { isMatchOpen } from "@/lib/match-utils";
import { ClipboardList, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Match = {
  id: string;
  stage: string;
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
  user_id: string;
  match_id: string;
  score1_home: number;
  score1_away: number;
  score2_home: number;
  score2_away: number;
  score3_home: number;
  score3_away: number;
  updated_at: string;
};

type Profile = {
  id: string;
  display_name: string;
  disqualified: boolean;
};

export const Route = createFileRoute("/_authenticated/predictions")({
  head: () => ({ meta: [{ title: "Pronosticuri · ORBICO WC2026" }] }),
  component: PredictionsPage,
});

function PredictionsPage() {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id ?? null;
    setUserId(uid);

    const { data: allMatches } = await supabase
      .from("matches")
      .select("id,stage,kickoff_at,status,group_letter,home_score,away_score,home_team_label,away_team_label,home_team:teams!matches_home_team_id_fkey(name,code,flag_emoji),away_team:teams!matches_away_team_id_fkey(name,code,flag_emoji)")
      .order("kickoff_at", { ascending: true });

    const open = ((allMatches ?? []) as unknown as Match[]).filter((m) =>
      isMatchOpen(m.status, m.kickoff_at, m.home_score),
    );
    setMatches(open);

    if (open.length === 0) {
      setPredictions([]);
      setProfiles([]);
      setError(null);
      return;
    }

    const openIds = open.map((m) => m.id);
    const { data: preds, error: predError } = await supabase
      .from("predictions")
      .select("id,user_id,match_id,score1_home,score1_away,score2_home,score2_away,score3_home,score3_away,updated_at")
      .in("match_id", openIds);

    if (predError) {
      setError(predError.message);
      setPredictions([]);
      setProfiles([]);
      return;
    }

    const predList = (preds ?? []) as Prediction[];
    setPredictions(predList);
    setError(null);

    const userIds = [...new Set(predList.map((p) => p.user_id))];
    if (userIds.length === 0) {
      setProfiles([]);
      return;
    }

    const { data: profs } = await supabase
      .from("profiles")
      .select("id,display_name,disqualified")
      .in("id", userIds);
    setProfiles((profs ?? []) as Profile[]);
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

  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const predsByMatch = useMemo(() => {
    const map = new Map<string, Prediction[]>();
    for (const p of predictions) {
      const list = map.get(p.match_id) ?? [];
      list.push(p);
      map.set(p.match_id, list);
    }
    return map;
  }, [predictions]);

  const participantCount = profiles.filter((p) => !p.disqualified).length;

  if (matches === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pronosticuri active"
        description="Toți participanții pot vedea pronosticurile pentru meciurile încă deschise."
        icon={<ClipboardList className="h-5 w-5 text-white" />}
      />

      {error && (
        <div className="rounded-xl border border-[var(--wc-red)]/30 bg-[#fde8e9] px-4 py-3 text-sm text-[var(--wc-red)]">
          Nu s-au putut încărca pronosticurile: {error}
          <p className="mt-1 text-xs opacity-90">
            Rulează migrarea Supabase <code className="font-mono">20260605200000_predictions_public_open_matches.sql</code>
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Meciuri deschise" value={matches.length} accent="hermes" />
        <StatCard label="Pronosticuri totale" value={predictions.length} accent="green" />
        <StatCard label="Participanți activi" value={participantCount} accent="red" />
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
        <MatchPhaseTabs
          matches={matches}
          getMatchKey={(m) => m.id}
          emptyGroupMessage="Niciun meci de grupă deschis momentan."
          emptyKnockoutMessage="Niciun meci de play-off deschis momentan."
          renderMatch={(m) => (
            <MatchPredictionsBlock
              match={m}
              predictions={(predsByMatch.get(m.id) ?? []).sort((a, b) => {
                const na = profileMap.get(a.user_id)?.display_name ?? "";
                const nb = profileMap.get(b.user_id)?.display_name ?? "";
                return na.localeCompare(nb, "ro");
              })}
              profileMap={profileMap}
              userId={userId}
            />
          )}
        />
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

function MatchPredictionsBlock({
  match: m,
  predictions,
  profileMap,
  userId,
}: {
  match: Match;
  predictions: Prediction[];
  profileMap: Map<string, Profile>;
  userId: string | null;
}) {
  const homeName = m.home_team?.name ?? m.home_team_label ?? "TBD";
  const awayName = m.away_team?.name ?? m.away_team_label ?? "TBD";
  const time = formatKickoffTime(m.kickoff_at);
  const dateShort = formatKickoffDateShort(m.kickoff_at);
  const phaseLabel = getMatchPhaseLabel(m.stage, m.group_letter);

  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-black tabular-nums text-[var(--wc-hermes)]">{time}</span>
            <span className="text-[10px] capitalize text-muted-foreground">{dateShort}</span>
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">{phaseLabel}</span>
            <span className="text-[10px] text-muted-foreground">
              {predictions.length} {predictions.length === 1 ? "pronostic" : "pronosticuri"}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TeamFlag code={m.home_team?.code} name={homeName} emoji={m.home_team?.flag_emoji} size="sm" />
            <span className="text-sm font-bold">{homeName}</span>
            <span className="text-xs font-bold text-muted-foreground">vs</span>
            <span className="text-sm font-bold">{awayName}</span>
            <TeamFlag code={m.away_team?.code} name={awayName} emoji={m.away_team?.flag_emoji} size="sm" />
          </div>
        </div>
        <Link
          to="/matches/$id"
          params={{ id: m.id }}
          className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-[var(--wc-hermes)] hover:underline"
        >
          {userId && predictions.some((p) => p.user_id === userId) ? "Modifică" : "Pronostichează"}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {predictions.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Niciun participant nu a pronosticat încă.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {predictions.map((p) => {
            const profile = profileMap.get(p.user_id);
            const isMe = p.user_id === userId;
            return (
              <li
                key={p.id}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
                  isMe
                    ? "border-[var(--wc-hermes)]/30 bg-[var(--wc-hermes)]/[0.06]"
                    : "border-[var(--wc-light-gray)] bg-muted/20",
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className={cn("truncate text-sm font-semibold", isMe && "text-[var(--wc-hermes)]")}>
                    {profile?.display_name ?? "Participant"}
                    {isMe && <span className="ml-1 text-xs font-normal text-muted-foreground">(tu)</span>}
                  </span>
                  {profile?.disqualified && (
                    <span className="shrink-0 rounded-full border border-[var(--wc-red)]/30 bg-[#fde8e9] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--wc-red)]">
                      Descalificat
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs text-muted-foreground">{formatPredictionScores(p)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
