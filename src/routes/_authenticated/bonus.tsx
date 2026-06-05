import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Team = { id: string; name: string; flag_emoji: string | null };
type Settings = { bonus_lock_at: string | null; champion_team_id: string | null; top_scorer_name: string | null; champion_points: number; top_scorer_points: number };

export const Route = createFileRoute("/_authenticated/bonus")({
  head: () => ({ meta: [{ title: "Bonus · OMD WC2026" }] }),
  component: BonusPage,
});

function BonusPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [champion, setChampion] = useState<string>("");
  const [topScorer, setTopScorer] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [{ data: t }, { data: s }, { data: u }] = await Promise.all([
      supabase.from("teams").select("id,name,flag_emoji").order("name"),
      supabase.from("tournament_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.auth.getUser(),
    ]);
    setTeams((t ?? []) as Team[]);
    setSettings(s as Settings);
    if (u.user) {
      const { data: bp } = await supabase.from("bonus_predictions").select("*").eq("user_id", u.user.id).maybeSingle();
      if (bp) { setChampion(bp.champion_team_id ?? ""); setTopScorer(bp.top_scorer_name ?? ""); }
    }
  };

  useEffect(() => { load(); }, []);

  const locked = !!settings?.bonus_lock_at && new Date(settings.bonus_lock_at) <= new Date();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("bonus_predictions").upsert({
      user_id: u.user.id,
      champion_team_id: champion || null,
      top_scorer_name: topScorer || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Bonus salvat!");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Predicții bonus</h1>
      <Card>
        <CardHeader>
          <CardTitle>Campion & Golgheter</CardTitle>
          <CardDescription>
            +{settings?.champion_points ?? 5} pct campion corect · +{settings?.top_scorer_points ?? 5} pct golgheter corect.
            {locked && <span className="ml-1 text-destructive">Bonus blocat.</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label>Campion mondial</Label>
              <Select value={champion} onValueChange={setChampion} disabled={locked}>
                <SelectTrigger><SelectValue placeholder="Alege echipa" /></SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.flag_emoji} {t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Golgheter (nume jucător)</Label>
              <Input value={topScorer} onChange={(e) => setTopScorer(e.target.value)} disabled={locked} placeholder="ex. Kylian Mbappé" />
            </div>
            {!locked && <Button type="submit" disabled={saving}>Salvează</Button>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
