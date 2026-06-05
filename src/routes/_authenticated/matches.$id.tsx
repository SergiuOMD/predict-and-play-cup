import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Match = {
  id: string;
  kickoff_at: string;
  status: string;
  group_letter: string | null;
  stage: string;
  home_score: number | null;
  away_score: number | null;
  home_team_label: string | null;
  away_team_label: string | null;
  home_team: { name: string; flag_emoji: string | null } | null;
  away_team: { name: string; flag_emoji: string | null } | null;
};
type Pred = {
  score1_home: number; score1_away: number;
  score2_home: number; score2_away: number;
  score3_home: number; score3_away: number;
  points: number;
};

export const Route = createFileRoute("/_authenticated/matches/$id")({
  component: MatchDetail,
});

function MatchDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [pred, setPred] = useState<Pred>({
    score1_home: 0, score1_away: 0,
    score2_home: 0, score2_away: 0,
    score3_home: 0, score3_away: 0,
    points: 0,
  });
  const [hasPred, setHasPred] = useState(false);
  const [allPreds, setAllPreds] = useState<Array<{ display_name: string; avatar_url: string | null; score1_home: number; score1_away: number; score2_home: number; score2_away: number; score3_home: number; score3_away: number; points: number }>>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data: m } = await supabase
      .from("matches")
      .select("id,kickoff_at,status,group_letter,stage,home_score,away_score,home_team_label,away_team_label,home_team:teams!matches_home_team_id_fkey(name,flag_emoji),away_team:teams!matches_away_team_id_fkey(name,flag_emoji)")
      .eq("id", id).maybeSingle();
    setMatch(m as unknown as Match);

    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      const { data: p } = await supabase.from("predictions").select("score1_home,score1_away,score2_home,score2_away,score3_home,score3_away,points").eq("match_id", id).eq("user_id", u.user.id).maybeSingle();
      if (p) { setPred(p); setHasPred(true); }
    }

    // Try to load everyone's predictions (will only work after kickoff per RLS)
    const { data: all } = await supabase
      .from("predictions")
      .select("user_id,score1_home,score1_away,score2_home,score2_away,score3_home,score3_away,points")
      .eq("match_id", id);
    if (all && all.length > 0) {
      const ids = Array.from(new Set(all.map((r) => r.user_id)));
      const { data: profs } = await supabase.from("profiles").select("id,display_name,avatar_url").in("id", ids);
      const pmap = new Map((profs ?? []).map((p) => [p.id, p]));
      setAllPreds(all.map((r) => ({
        score1_home: r.score1_home, score1_away: r.score1_away,
        score2_home: r.score2_home, score2_away: r.score2_away,
        score3_home: r.score3_home, score3_away: r.score3_away,
        points: r.points,
        display_name: pmap.get(r.user_id)?.display_name ?? "Anonim",
        avatar_url: pmap.get(r.user_id)?.avatar_url ?? null,
      })));
    }
  };

  useEffect(() => {
    load();
    const ch = supabase.channel(`match-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches", filter: `id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "predictions", filter: `match_id=eq.${id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!match) return <div>Se încarcă...</div>;

  const locked = new Date(match.kickoff_at).getTime() - Date.now() < 60 * 60 * 1000;
  const finished = match.status === "finished" && match.home_score !== null;
  const home = match.home_team ? `${match.home_team.flag_emoji ?? ""} ${match.home_team.name}` : (match.home_team_label ?? "TBD");
  const away = match.away_team ? `${match.away_team.flag_emoji ?? ""} ${match.away_team.name}` : (match.away_team_label ?? "TBD");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const payload = { ...pred, user_id: u.user.id, match_id: id };
    const { error } = hasPred
      ? await supabase.from("predictions").update(pred).eq("user_id", u.user.id).eq("match_id", id)
      : await supabase.from("predictions").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Pronosticuri salvate!");
    setHasPred(true);
  };

  const numField = (key: keyof Pred) => (
    <Input
      type="number" min={0} max={30} required
      className="w-16 text-center"
      value={pred[key] as number}
      onChange={(e) => setPred({ ...pred, [key]: Number(e.target.value) || 0 })}
      disabled={locked}
    />
  );

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/matches" })}>← Înapoi</Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{home} vs {away}</CardTitle>
            <div className="flex gap-2">
              {match.group_letter && <Badge variant="outline">Grupa {match.group_letter}</Badge>}
              {finished ? <Badge>Final {match.home_score}-{match.away_score}</Badge>
                : locked ? <Badge variant="destructive">Blocat</Badge>
                : <Badge variant="outline">Deschis</Badge>}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(match.kickoff_at).toLocaleString("ro-RO")}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Introdu 3 pronosticuri. 1 punct pentru fiecare scor exact (max 3 puncte).
              {locked && <span className="ml-1 text-destructive">Pronosticurile sunt blocate cu 1h înainte de kickoff.</span>}
            </p>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-center gap-3">
                <span className="w-12 text-sm text-muted-foreground">P{i}</span>
                <span className="w-32 text-right">{home}</span>
                {numField(`score${i}_home` as keyof Pred)}
                <span>-</span>
                {numField(`score${i}_away` as keyof Pred)}
                <span className="w-32">{away}</span>
              </div>
            ))}
            {!locked && <Button type="submit" disabled={saving} className="w-full">{hasPred ? "Actualizează" : "Trimite"}</Button>}
            {hasPred && finished && (
              <div className="text-center text-sm">
                Ai obținut <span className="font-bold text-primary">{pred.points}</span> {pred.points === 1 ? "punct" : "puncte"}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {(locked || finished) && allPreds.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Pronosticurile tuturor</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allPreds.sort((a, b) => b.points - a.points).map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-sm">
                  <span className="font-medium">{p.display_name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.score1_home}-{p.score1_away} · {p.score2_home}-{p.score2_away} · {p.score3_home}-{p.score3_away}
                  </span>
                  <Badge variant={p.points > 0 ? "default" : "secondary"}>{p.points} pct</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
