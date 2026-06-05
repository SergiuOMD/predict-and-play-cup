import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Target, Clock } from "lucide-react";

type Match = {
  id: string;
  kickoff_at: string;
  status: string;
  group_letter: string | null;
  home_score: number | null;
  away_score: number | null;
  home_team_label: string | null;
  away_team_label: string | null;
  home_team: { name: string; flag_emoji: string | null } | null;
  away_team: { name: string; flag_emoji: string | null } | null;
};

type LeaderboardRow = {
  user_id: string;
  display_name: string;
  total_points: number;
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · OMD WC2026" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [todayMatches, setTodayMatches] = useState<Match[]>([]);
  const [upcoming, setUpcoming] = useState<Match[]>([]);
  const [predictedIds, setPredictedIds] = useState<Set<string>>(new Set());
  const [rank, setRank] = useState<{ position: number; total: number; points: number } | null>(null);
  const [displayName, setDisplayName] = useState("");

  const load = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();
    setDisplayName(profile?.display_name ?? "Jucător");

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: matches } = await supabase
      .from("matches")
      .select(
        "id,kickoff_at,status,group_letter,home_score,away_score,home_team_label,away_team_label,home_team:teams!matches_home_team_id_fkey(name,flag_emoji),away_team:teams!matches_away_team_id_fkey(name,flag_emoji)",
      )
      .order("kickoff_at", { ascending: true });

    const all = (matches ?? []) as unknown as Match[];
    setTodayMatches(
      all.filter((m) => {
        const k = new Date(m.kickoff_at);
        return k >= startOfDay && k <= endOfDay;
      }),
    );
    setUpcoming(
      all.filter((m) => new Date(m.kickoff_at) > endOfDay && m.status !== "finished").slice(0, 5),
    );

    const { data: preds } = await supabase.from("predictions").select("match_id").eq("user_id", userId);
    setPredictedIds(new Set((preds ?? []).map((p) => p.match_id)));

    const { data: lb } = await supabase.from("leaderboard").select("user_id,display_name,total_points");
    const sorted = ((lb ?? []) as LeaderboardRow[]).sort(
      (a, b) => b.total_points - a.total_points,
    );
    const idx = sorted.findIndex((r) => r.user_id === userId);
    if (idx >= 0) {
      setRank({ position: idx + 1, total: sorted.length, points: sorted[idx].total_points });
    } else {
      setRank({ position: sorted.length + 1, total: sorted.length, points: 0 });
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "predictions" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Salut, {displayName}!</h1>
        <p className="text-sm text-muted-foreground">Rezumatul tău pentru World Cup 2026</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-primary" />
              Locul tău
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rank ? (
              <>
                <div className="text-3xl font-bold">
                  #{rank.position}
                  <span className="text-base font-normal text-muted-foreground"> / {rank.total || "—"}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{rank.points} puncte totale</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Niciun punct încă</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              Pronosticuri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{predictedIds.size}</div>
            <p className="mt-1 text-sm text-muted-foreground">meciuri cu predicții trimise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Azi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayMatches.length}</div>
            <p className="mt-1 text-sm text-muted-foreground">meciuri programate azi</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Meciurile de azi</h2>
        {todayMatches.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">Niciun meci azi.</Card>
        ) : (
          <div className="space-y-2">
            {todayMatches.map((m) => (
              <MatchCard key={m.id} m={m} hasPrediction={predictedIds.has(m.id)} />
            ))}
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Următoarele meciuri</h2>
          <div className="space-y-2">
            {upcoming.map((m) => (
              <MatchCard key={m.id} m={m} hasPrediction={predictedIds.has(m.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MatchCard({ m, hasPrediction }: { m: Match; hasPrediction: boolean }) {
  const home = m.home_team
    ? `${m.home_team.flag_emoji ?? ""} ${m.home_team.name}`
    : (m.home_team_label ?? "TBD");
  const away = m.away_team
    ? `${m.away_team.flag_emoji ?? ""} ${m.away_team.name}`
    : (m.away_team_label ?? "TBD");
  const time = new Date(m.kickoff_at).toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const locked = new Date(m.kickoff_at).getTime() - Date.now() < 60 * 60 * 1000;
  const finished = m.status === "finished" && m.home_score !== null;

  return (
    <Link to="/matches/$id" params={{ id: m.id }}>
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-accent">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{time}</span>
          {m.group_letter && <Badge variant="outline">Grupa {m.group_letter}</Badge>}
        </div>
        <div className="flex items-center gap-3 font-medium">
          <span>{home}</span>
          <span className="rounded bg-muted px-2 py-1 text-sm tabular-nums">
            {finished ? `${m.home_score} - ${m.away_score}` : "vs"}
          </span>
          <span>{away}</span>
        </div>
        <div className="flex gap-2">
          {hasPrediction ? (
            <Badge variant="secondary">Pronostic trimis</Badge>
          ) : locked ? (
            <Badge variant="destructive">Blocat</Badge>
          ) : (
            <Badge variant="outline">Deschis</Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
