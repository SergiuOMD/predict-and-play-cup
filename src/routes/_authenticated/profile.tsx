import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type PredictionRow = {
  id: string;
  points: number;
  score1_home: number;
  score1_away: number;
  score2_home: number;
  score2_away: number;
  score3_home: number;
  score3_away: number;
  updated_at: string;
  match: {
    id: string;
    kickoff_at: string;
    status: string;
    home_score: number | null;
    away_score: number | null;
    home_team_label: string | null;
    away_team_label: string | null;
    home_team: { name: string; flag_emoji: string | null } | null;
    away_team: { name: string; flag_emoji: string | null } | null;
  } | null;
};

type Profile = {
  display_name: string;
  email: string;
  avatar_url: string | null;
};

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profil · OMD WC2026" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name,email,avatar_url")
        .eq("id", userId)
        .maybeSingle();
      setProfile(prof);

      const { data: preds } = await supabase
        .from("predictions")
        .select(
          "id,points,score1_home,score1_away,score2_home,score2_away,score3_home,score3_away,updated_at,match:matches(id,kickoff_at,status,home_score,away_score,home_team_label,away_team_label,home_team:teams!matches_home_team_id_fkey(name,flag_emoji),away_team:teams!matches_away_team_id_fkey(name,flag_emoji))",
        )
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      const rows = (preds ?? []) as unknown as PredictionRow[];
      setPredictions(rows);
      setTotalPoints(rows.reduce((sum, p) => sum + p.points, 0));
      setLoading(false);
    };

    load();
    const ch = supabase
      .channel("profile-preds")
      .on("postgres_changes", { event: "*", schema: "public", table: "predictions" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback>{profile?.display_name?.charAt(0).toUpperCase() ?? "?"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{profile?.display_name}</h1>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <p className="mt-1 text-sm">
              <span className="font-semibold">{totalPoints}</span> puncte din meciuri ·{" "}
              <span className="font-semibold">{predictions.length}</span> pronosticuri
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Istoric pronosticuri</CardTitle>
        </CardHeader>
        <CardContent>
          {predictions.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Nu ai trimis încă niciun pronostic.{" "}
              <Link to="/matches" className="text-primary underline">
                Vezi meciurile
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {predictions.map((p) => (
                <PredictionHistoryRow key={p.id} p={p} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PredictionHistoryRow({ p }: { p: PredictionRow }) {
  const m = p.match;
  if (!m) return null;

  const home = m.home_team
    ? `${m.home_team.flag_emoji ?? ""} ${m.home_team.name}`
    : (m.home_team_label ?? "TBD");
  const away = m.away_team
    ? `${m.away_team.flag_emoji ?? ""} ${m.away_team.name}`
    : (m.away_team_label ?? "TBD");
  const date = new Date(m.kickoff_at).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const finished = m.status === "finished" && m.home_score !== null;
  const scores = [
    `${p.score1_home}-${p.score1_away}`,
    `${p.score2_home}-${p.score2_away}`,
    `${p.score3_home}-${p.score3_away}`,
  ].join(" · ");

  return (
    <Link to="/matches/$id" params={{ id: m.id }}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-accent">
        <div>
          <div className="font-medium">
            {home} vs {away}
          </div>
          <div className="text-xs text-muted-foreground">{date}</div>
          <div className="mt-1 text-sm tabular-nums">{scores}</div>
        </div>
        <div className="flex items-center gap-2">
          {finished && (
            <span className="text-sm text-muted-foreground">
              Rezultat: {m.home_score}-{m.away_score}
            </span>
          )}
          <Badge>{p.points} pct</Badge>
        </div>
      </div>
    </Link>
  );
}
