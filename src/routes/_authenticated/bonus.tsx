import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/app/page-header";
import { TeamFlag } from "@/components/app/team-flag";
import { toast } from "sonner";
import { Star, Trophy, Target } from "lucide-react";

type Team = { id: string; name: string; code: string | null; flag_emoji: string | null };
type Settings = {
  bonus_lock_at: string | null;
  champion_team_id: string | null;
  top_scorer_name: string | null;
  champion_points: number;
  top_scorer_points: number;
};

export const Route = createFileRoute("/_authenticated/bonus")({
  head: () => ({ meta: [{ title: "Bonus · ORBICO WC2026" }] }),
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
      supabase.from("teams").select("id,name,code,flag_emoji").order("name"),
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
    <div className="space-y-6">
      <PageHeader
        title="Predicții bonus"
        description="Alege campionul mondial și golgheterul turneului — puncte extra la final."
        icon={<Star className="h-5 w-5 text-white" />}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="app-card flex items-start gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--wc-hermes)]/10">
            <Trophy className="h-5 w-5 text-[var(--wc-hermes)]" />
          </div>
          <div>
            <p className="font-bold text-[var(--wc-hermes)]">Campion mondial</p>
            <p className="text-2xl font-black">+{settings?.champion_points ?? 5} pct</p>
          </div>
        </div>
        <div className="app-card flex items-start gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--wc-green)]/10">
            <Target className="h-5 w-5 text-[var(--wc-green)]" />
          </div>
          <div>
            <p className="font-bold text-[var(--wc-green)]">Golgheter</p>
            <p className="text-2xl font-black">+{settings?.top_scorer_points ?? 5} pct</p>
          </div>
        </div>
      </div>

      <div className="app-card overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[var(--wc-hermes)] via-[var(--wc-green)] to-[var(--wc-red)]" />
        <div className="p-6 sm:p-8">
          {locked && (
            <div className="mb-6 rounded-lg border border-[var(--wc-red)]/30 bg-[#fde8e9] px-4 py-3 text-sm font-medium text-[var(--wc-red)]">
              Predicțiile bonus sunt blocate.
            </div>
          )}
          <form method="post" onSubmit={save} className="mx-auto max-w-md space-y-5">
            <div className="space-y-2">
              <Label className="text-[var(--wc-dark-gray)]">Campion mondial</Label>
              <Select value={champion} onValueChange={setChampion} disabled={locked}>
                <SelectTrigger className="h-11 border-[var(--wc-light-gray)]">
                  <SelectValue placeholder="Alege echipa" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="flex items-center gap-2">
                        <TeamFlag code={t.code} name={t.name} emoji={t.flag_emoji} size="sm" />
                        {t.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[var(--wc-dark-gray)]">Golgheter (nume jucător)</Label>
              <Input
                value={topScorer}
                onChange={(e) => setTopScorer(e.target.value)}
                disabled={locked}
                placeholder="ex. Kylian Mbappé"
                className="h-11 border-[var(--wc-light-gray)]"
              />
            </div>
            {!locked && (
              <Button type="submit" disabled={saving} className="h-11 w-full bg-gradient-hermes font-semibold hover:opacity-90">
                {saving ? "Se salvează..." : "Salvează predicțiile bonus"}
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
