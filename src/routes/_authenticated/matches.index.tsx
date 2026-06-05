import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/page-header";
import { TeamFlag } from "@/components/app/team-flag";
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
  home_team: { name: string; code: string | null; flag_emoji: string | null } | null;
  away_team: { name: string; code: string | null; flag_emoji: string | null } | null;
};

export const Route = createFileRoute("/_authenticated/matches/")({
  head: () => ({ meta: [{ title: "Meciuri · ORBICO WC2026" }] }),
  component: MatchesPage,
});

const STATUS_STRIPE: Record<string, string> = {
  open: "bg-[var(--wc-green)]",
  locked: "bg-[var(--wc-red)]",
  finished: "bg-[var(--wc-hermes)]",
  live: "bg-[var(--wc-red)]",
};

const FACEOFF_GRID =
  "grid w-full grid-cols-[minmax(0,1fr)_2.25rem_4rem_2.25rem_minmax(0,1fr)] items-center gap-x-2 sm:gap-x-3";

function MatchesPage() {
  const [matches, setMatches] = useState<Match[] | null>(null);

  const fetchMatches = async () => {
    const { data } = await supabase
      .from("matches")
      .select("id,stage,group_letter,kickoff_at,status,home_score,away_score,home_team_label,away_team_label,home_team:teams!matches_home_team_id_fkey(name,code,flag_emoji),away_team:teams!matches_away_team_id_fkey(name,code,flag_emoji)")
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
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-[4.5rem] rounded-xl" />)}
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
        <section key={date} className="app-card overflow-hidden">
          <div className="bg-gradient-hermes px-4 py-2.5 sm:px-5">
            <h2 className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-white/90 sm:text-xs">
              {date}
            </h2>
          </div>
          <ul className="divide-y divide-[var(--wc-light-gray)]">
            {list.map((m) => <MatchRow key={m.id} m={m} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}

function MatchRow({ m }: { m: Match }) {
  const homeName = m.home_team?.name ?? m.home_team_label ?? "TBD";
  const awayName = m.away_team?.name ?? m.away_team_label ?? "TBD";
  const time = new Date(m.kickoff_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
  const matchStatus = getMatchStatus(m.status, m.kickoff_at, m.home_score);
  const finished = matchStatus === "finished";
  const score = finished ? `${m.home_score} - ${m.away_score}` : undefined;

  return (
    <li>
      <Link
        to="/matches/$id"
        params={{ id: m.id }}
        className="group flex items-stretch transition-colors hover:bg-[var(--wc-hermes)]/[0.04] active:bg-[var(--wc-hermes)]/[0.07]"
      >
        <div className={cn("w-1 shrink-0", STATUS_STRIPE[matchStatus])} aria-hidden />

        {/* Desktop */}
        <div className="hidden min-w-0 flex-1 items-center gap-5 px-5 py-3.5 sm:flex">
          <div className="w-[4.75rem] shrink-0">
            <p className="text-base font-black tabular-nums leading-none text-[var(--wc-hermes)]">{time}</p>
            <div className="mt-1.5 flex flex-col items-start gap-1">
              {m.group_letter && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Grupa {m.group_letter}
                </span>
              )}
              <MatchStatusBadge status={matchStatus} score={score} className="px-1.5 py-0 text-[10px]" />
            </div>
          </div>

          <MatchFaceoff
            className="max-w-xl flex-1"
            homeName={homeName}
            awayName={awayName}
            homeTeam={m.home_team}
            awayTeam={m.away_team}
            finished={finished}
            homeScore={m.home_score}
            awayScore={m.away_score}
          />

          <div className="flex w-[6.5rem] shrink-0 justify-end">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--wc-hermes)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-[var(--wc-hermes)]/90">
              Pronostic
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Mobile */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 px-4 py-3.5 sm:hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tabular-nums text-[var(--wc-hermes)]">{time}</span>
              {m.group_letter && (
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Gr {m.group_letter}
                </span>
              )}
              <MatchStatusBadge status={matchStatus} score={score} className="px-1.5 py-0 text-[10px]" />
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--wc-hermes)]/50 group-hover:text-[var(--wc-hermes)]" />
          </div>

          <MatchFaceoff
            homeName={homeName}
            awayName={awayName}
            homeTeam={m.home_team}
            awayTeam={m.away_team}
            finished={finished}
            homeScore={m.home_score}
            awayScore={m.away_score}
          />
        </div>
      </Link>
    </li>
  );
}

type FaceoffProps = {
  homeName: string;
  awayName: string;
  homeTeam: Match["home_team"];
  awayTeam: Match["away_team"];
  finished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  className?: string;
};

function MatchFaceoff({
  homeName,
  awayName,
  homeTeam,
  awayTeam,
  finished,
  homeScore,
  awayScore,
  className,
}: FaceoffProps) {
  return (
    <div className={cn(FACEOFF_GRID, className)}>
      <span className="truncate text-right text-sm font-bold leading-tight">{homeName}</span>

      <TeamFlag
        code={homeTeam?.code}
        name={homeName}
        emoji={homeTeam?.flag_emoji}
        size="md"
        className="justify-self-center"
      />

      <div
        className={cn(
          "flex h-9 w-full items-center justify-center justify-self-center rounded-lg text-xs font-black tabular-nums shadow-sm",
          finished
            ? "bg-[var(--wc-dark-gray)] text-white"
            : "bg-[var(--wc-hermes)] text-white",
        )}
      >
        {finished ? `${homeScore}-${awayScore}` : "VS"}
      </div>

      <TeamFlag
        code={awayTeam?.code}
        name={awayName}
        emoji={awayTeam?.flag_emoji}
        size="md"
        className="justify-self-center"
      />

      <span className="truncate text-left text-sm font-bold leading-tight">{awayName}</span>
    </div>
  );
}
