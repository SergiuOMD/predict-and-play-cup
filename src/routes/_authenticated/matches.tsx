import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
  head: () => ({ meta: [{ title: "Meciuri · OMD WC2026" }] }),
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
    return <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;
  }

  if (matches.length === 0) {
    return (
      <Card className="p-8 text-center">
        <h2 className="font-semibold">Niciun meci încărcat încă</h2>
        <p className="mt-2 text-sm text-muted-foreground">Adminul va încărca fixtures-urile în curând.</p>
      </Card>
    );
  }

  // Group by date
  const groups = matches.reduce<Record<string, Match[]>>((acc, m) => {
    const d = new Date(m.kickoff_at).toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" });
    (acc[d] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meciuri</h1>
      {Object.entries(groups).map(([date, list]) => (
        <section key={date} className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{date}</h2>
          <div className="space-y-2">
            {list.map((m) => <MatchRow key={m.id} m={m} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function MatchRow({ m }: { m: Match }) {
  const home = m.home_team ? `${m.home_team.flag_emoji ?? ""} ${m.home_team.name}` : (m.home_team_label ?? "TBD");
  const away = m.away_team ? `${m.away_team.flag_emoji ?? ""} ${m.away_team.name}` : (m.away_team_label ?? "TBD");
  const time = new Date(m.kickoff_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
  const locked = new Date(m.kickoff_at).getTime() - Date.now() < 60 * 60 * 1000;
  const finished = m.status === "finished" && m.home_score !== null;

  return (
    <Link to="/matches/$id" params={{ id: m.id }}>
      <Card className="flex flex-col gap-3 p-4 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs text-muted-foreground">{time}</div>
          {m.group_letter && <Badge variant="outline">Grupa {m.group_letter}</Badge>}
          {m.stage !== "group" && <Badge variant="secondary">{m.stage}</Badge>}
          {finished ? <Badge>Final</Badge> : locked ? <Badge variant="destructive">Blocat</Badge> : <Badge variant="outline">Deschis</Badge>}
        </div>
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 font-medium sm:w-auto sm:gap-4">
          <span className="truncate text-right text-sm sm:text-base">{home}</span>
          <span className="rounded bg-muted px-2 py-1 text-center text-sm tabular-nums">
            {finished ? `${m.home_score} - ${m.away_score}` : "vs"}
          </span>
          <span className="truncate text-sm sm:text-base">{away}</span>
        </div>
      </Card>
    </Link>
  );
}
