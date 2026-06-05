import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/page-header";
import { MatchStatusBadge } from "@/components/app/match-status-badge";
import { getMatchStatus } from "@/lib/match-utils";
import { Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

export const Route = createFileRoute("/_authenticated/matches/")({
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
          <div className="app-card divide-y divide-[var(--wc-light-gray)] overflow-hidden">
            {list.map((m) => <MatchRow key={m.id} m={m} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function TeamCell({
  name,
  flag,
  side,
}: {
  name: string;
  flag: string;
  side: "home" | "away";
}) {
  const isHome = side === "home";
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2.5",
        isHome ? "flex-row-reverse justify-end" : "flex-row justify-start",
      )}
    >
      <span className="shrink-0 text-2xl leading-none" aria-hidden>
        {flag || "🏳️"}
      </span>
      <span
        className={cn(
          "min-w-0 truncate text-sm font-bold leading-tight sm:text-base",
          isHome ? "text-right" : "text-left",
        )}
      >
        {name}
      </span>
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
    <Link
      to="/matches/$id"
      params={{ id: m.id }}
      className="group block transition-colors hover:bg-[var(--wc-hermes)]/[0.04]"
    >
      <article className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[var(--wc-hermes)]/10 px-2.5 py-1 text-xs font-bold tabular-nums text-[var(--wc-hermes)]">
            {time}
          </span>
          {m.group_letter && (
            <Badge variant="outline" className="border-[var(--wc-light-gray)] font-medium text-[var(--wc-dark-gray)]">
              Grupa {m.group_letter}
            </Badge>
          )}
          {m.stage !== "group" && (
            <Badge variant="secondary" className="capitalize">{m.stage}</Badge>
          )}
          <MatchStatusBadge status={matchStatus} score={score} />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)] items-center gap-x-3 sm:gap-x-6">
          <TeamCell name={homeName} flag={homeFlag} side="home" />
          <div className="flex h-11 w-[5.5rem] shrink-0 items-center justify-center self-center rounded-xl bg-gradient-hermes text-xs font-black tabular-nums text-white shadow-sm sm:text-sm">
            {finished ? `${m.home_score}-${m.away_score}` : "VS"}
          </div>
          <TeamCell name={awayName} flag={awayFlag} side="away" />
        </div>

        <div className="mt-3 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex items-center gap-0.5 text-xs font-medium text-[var(--wc-hermes)]">
            Pronostichează <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}
