import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/page-header";
import { MatchStatusBadge } from "@/components/app/match-status-badge";
import { getMatchStatus } from "@/lib/match-utils";
import { Calendar } from "lucide-react";

type Match = {
  id: string;
  stage: string;
  group_letter: string | null;
  kickoff_at: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_team_label: string | null;
  away_team_label: string | null;
  home_team: { name: string; flag_emoji: string | null } | null;
  away_team: { name: string; flag_emoji: string | null } | null;
};

export const Route = createFileRoute("/_authenticated/matches")({
  head: () => ({ meta: [{ title: "Meciuri · ORBICO WC2026" }] }),
  component: MatchesPage,
});

function MatchesPage() {
  const [matches, setMatches] = useState<Match[] | null>(null);

  const fetchMatches = async () => {
    const { data } = await supabase
      .from("matches")
      .select("id,stage,group_letter,kickoff_at,status,home_score,away_score,home_team_label,away_team_label,home_team:teams!matches_home_team_id_fkey(name,flag_emoji),away_team:teams!matches_away_team_id_fkey(name,flag_emoji)")
      .order("kickoff_at", { ascending: true });
    setMatches((data as unknown as Match[]) ?? []);
  };

  useEffect(() => {
    fetchMatches();
    const ch = supabase
      .channel("matches-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, fetchMatches)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (matches === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <>
        <PageHeader
          title="Meciuri"
          description="Pronostichează scorurile pentru fiecare meci al turneului."
          icon={<Calendar className="h-5 w-5 text-white" />}
        />
        <div className="app-card p-10 text-center">
          <Calendar className="mx-auto h-12 w-12 text-[var(--wc-hermes)]/40" />
          <h2 className="mt-4 text-lg font-bold">Niciun meci încărcat încă</h2>
          <p className="mt-2 text-sm text-muted-foreground">Adminul va încărca fixtures-urile în curând.</p>
        </div>
      </>
    );
  }

  const groups = matches.reduce<Record<string, Match[]>>((acc, m) => {
    const d = new Date(m.kickoff_at).toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" });
    (acc[d] ??= []).push(m);
    return acc;
  }, {});

  const openCount = matches.filter((m) => getMatchStatus(m.status, m.kickoff_at, m.home_score) === "open").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meciuri"
        description={`${matches.length} meciuri · ${openCount} deschise pentru pronostic`}
        icon={<Calendar className="h-5 w-5 text-white" />}
      />

      {Object.entries(groups).map(([date, list]) => (
        <section key={date} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--wc-light-gray)]" />
            <h2 className="shrink-0 text-xs font-bold uppercase tracking-widest text-[var(--wc-hermes)]">{date}</h2>
            <div className="h-px flex-1 bg-[var(--wc-light-gray)]" />
          </div>
          <div className="space-y-3">
            {list.map((m) => <MatchRow key={m.id} m={m} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function MatchRow({ m }: { m: Match }) {
  const homeName = m.home_team?.name ?? m.home_team_label ?? "TBD";
  const awayName = m.away_team?.name ?? m.away_team_label ?? "TBD";
  const homeFlag = m.home_team?.flag_emoji ?? "";
  const awayFlag = m.away_team?.flag_emoji ?? "";
  const time = new Date(m.kickoff_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
  const matchStatus = getMatchStatus(m.status, m.kickoff_at, m.home_score);
  const finished = matchStatus === "finished";
  const score = finished ? `${m.home_score} - ${m.away_score}` : undefined;

  return (
    <Link to="/matches/$id" params={{ id: m.id }} className="block">
      <article className="app-card app-card-interactive overflow-hidden">
        <div className="flex items-stretch">
          <div className="w-1 shrink-0 bg-[var(--wc-hermes)]" />
          <div className="flex flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[var(--wc-hermes)]/10 px-2 py-0.5 text-xs font-bold tabular-nums text-[var(--wc-hermes)]">
                {time}
              </span>
              {m.group_letter && (
                <Badge variant="outline" className="border-[var(--wc-light-gray)] text-[var(--wc-dark-gray)]">
                  Grupa {m.group_letter}
                </Badge>
              )}
              {m.stage !== "group" && (
                <Badge variant="secondary" className="capitalize">{m.stage}</Badge>
              )}
              <MatchStatusBadge status={matchStatus} score={score} />
            </div>

            <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 sm:w-auto sm:min-w-[320px] sm:gap-4">
              <div className="truncate text-right">
                <span className="mr-1.5 text-lg">{homeFlag}</span>
                <span className="text-sm font-semibold sm:text-base">{homeName}</span>
              </div>
              <div className="flex min-w-[4.5rem] items-center justify-center rounded-lg bg-gradient-hermes px-3 py-2 text-sm font-black tabular-nums text-white shadow-sm">
                {finished ? `${m.home_score} - ${m.away_score}` : "VS"}
              </div>
              <div className="truncate">
                <span className="mr-1.5 text-lg">{awayFlag}</span>
                <span className="text-sm font-semibold sm:text-base">{awayName}</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
