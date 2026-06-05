import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { importFixtures } from "@/lib/fixtures.functions";
import { PageHeader } from "@/components/app/page-header";
import { Shield } from "lucide-react";

type Match = {
  id: string;
  kickoff_at: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_team_label: string | null;
  away_team_label: string | null;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
};
type Team = { id: string; name: string; code: string | null; flag_emoji: string | null; group_letter: string | null };

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin · OMD WC2026" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const email = data.user?.email;
      if (!email) return setAuthorized(false);
      const { data: a } = await supabase.from("admins").select("email").ilike("email", email);
      setAuthorized(!!a && a.length > 0);
    });
  }, []);

  if (authorized === null) return <div className="app-card animate-pulse p-12 text-center text-muted-foreground">Se verifică...</div>;
  if (!authorized) return <div className="app-card p-10 text-center text-[var(--wc-red)] font-medium">Acces interzis.</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin"
        description="Gestionare meciuri, echipe și setări turneu."
        icon={<Shield className="h-5 w-5 text-white" />}
      />
      <ImportFixturesCard />
      <Tabs defaultValue="scores">
        <TabsList>
          <TabsTrigger value="scores">Scoruri meciuri</TabsTrigger>
          <TabsTrigger value="teams">Echipe</TabsTrigger>
          <TabsTrigger value="matches">Meciuri</TabsTrigger>
          <TabsTrigger value="settings">Setări bonus</TabsTrigger>
        </TabsList>
        <TabsContent value="scores"><ScoresTab /></TabsContent>
        <TabsContent value="teams"><TeamsTab /></TabsContent>
        <TabsContent value="matches"><MatchesTab /></TabsContent>
        <TabsContent value="settings"><SettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ImportFixturesCard() {
  const importFn = useServerFn(importFixtures);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try {
      const r = await importFn();
      toast.success(`Import OK: ${r.teamsUpserted}/${r.totalTeams} echipe, ${r.matchesUpserted}/${r.totalMatches} meciuri`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare la import");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Import fixtures (football-data.org)</CardTitle>
        <CardDescription>
          Importă/actualizează echipele și meciurile pentru FIFA World Cup 2026 din API-ul football-data.org.
          Reapasă oricând pentru a sincroniza rezultate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={run} disabled={loading}>
          {loading ? "Se importă..." : "Importă acum"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ScoresTab() {
  const [matches, setMatches] = useState<Match[]>([]);
  const load = async () => {
    const { data } = await supabase
      .from("matches")
      .select("id,kickoff_at,status,home_score,away_score,home_team_label,away_team_label,home_team:teams!matches_home_team_id_fkey(name),away_team:teams!matches_away_team_id_fkey(name)")
      .order("kickoff_at");
    setMatches((data ?? []) as unknown as Match[]);
  };
  useEffect(() => { load(); }, []);

  const save = async (m: Match, home: number, away: number, status: string) => {
    const { error } = await supabase.from("matches").update({
      home_score: home, away_score: away, status: status as "scheduled" | "live" | "finished" | "postponed",
    }).eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Scor salvat & puncte recalculate");
    load();
  };

  return (
    <Card><CardContent className="space-y-2 pt-6">
      {matches.length === 0 && <p className="text-muted-foreground">Niciun meci.</p>}
      {matches.map((m) => {
        const home = m.home_team?.name ?? m.home_team_label ?? "TBD";
        const away = m.away_team?.name ?? m.away_team_label ?? "TBD";
        return (
          <form key={m.id} method="post" onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            save(m, Number(fd.get("h")), Number(fd.get("a")), String(fd.get("status")));
          }} className="flex flex-wrap items-center gap-2 border-b py-2 text-sm">
            <span className="w-32 text-xs text-muted-foreground">{new Date(m.kickoff_at).toLocaleString("ro-RO")}</span>
            <span className="flex-1">{home} vs {away}</span>
            <Input name="h" type="number" min={0} defaultValue={m.home_score ?? 0} className="w-16" />
            <span>-</span>
            <Input name="a" type="number" min={0} defaultValue={m.away_score ?? 0} className="w-16" />
            <Select name="status" defaultValue={m.status}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="finished">Finished</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" size="sm">Salvează</Button>
          </form>
        );
      })}
    </CardContent></Card>
  );
}

function TeamsTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const load = async () => {
    const { data } = await supabase.from("teams").select("*").order("group_letter").order("name");
    setTeams((data ?? []) as Team[]);
  };
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("teams").insert({
      name: String(fd.get("name")),
      code: String(fd.get("code")) || null,
      flag_emoji: String(fd.get("flag")) || null,
      group_letter: String(fd.get("group")) || null,
    });
    if (error) return toast.error(error.message);
    (e.target as HTMLFormElement).reset();
    load();
  };

  return (
    <Card><CardContent className="space-y-4 pt-6">
      <form method="post" onSubmit={add} className="flex flex-wrap gap-2">
        <Input name="name" placeholder="Nume echipă" required className="flex-1 min-w-32" />
        <Input name="code" placeholder="Cod (FRA)" className="w-24" />
        <Input name="flag" placeholder="🇫🇷" className="w-20" />
        <Input name="group" placeholder="Grupă (A)" className="w-24" maxLength={1} />
        <Button type="submit">Adaugă</Button>
      </form>
      <div className="space-y-1">
        {teams.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded border p-2 text-sm">
            <span>{t.flag_emoji} {t.name} {t.group_letter && <span className="text-muted-foreground">· Grupa {t.group_letter}</span>}</span>
            <Button size="sm" variant="ghost" onClick={async () => {
              await supabase.from("teams").delete().eq("id", t.id); load();
            }}>Șterge</Button>
          </div>
        ))}
      </div>
    </CardContent></Card>
  );
}

function MatchesTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const load = async () => {
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase.from("teams").select("*").order("name"),
      supabase.from("matches").select("id,kickoff_at,status,home_score,away_score,home_team_label,away_team_label,home_team:teams!matches_home_team_id_fkey(name),away_team:teams!matches_away_team_id_fkey(name)").order("kickoff_at"),
    ]);
    setTeams((t ?? []) as Team[]);
    setMatches((m ?? []) as unknown as Match[]);
  };
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("matches").insert({
      home_team_id: String(fd.get("home")) || null,
      away_team_id: String(fd.get("away")) || null,
      kickoff_at: new Date(String(fd.get("kickoff"))).toISOString(),
      group_letter: String(fd.get("group")) || null,
      stage: String(fd.get("stage")) as "group",
      venue: String(fd.get("venue")) || null,
    });
    if (error) return toast.error(error.message);
    (e.target as HTMLFormElement).reset();
    load();
  };

  return (
    <Card><CardContent className="space-y-4 pt-6">
      <form method="post" onSubmit={add} className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Select name="home"><SelectTrigger><SelectValue placeholder="Acasă" /></SelectTrigger>
          <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select name="away"><SelectTrigger><SelectValue placeholder="Deplasare" /></SelectTrigger>
          <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
        <Input name="kickoff" type="datetime-local" required />
        <Input name="group" placeholder="Grupa" maxLength={1} />
        <Select name="stage" defaultValue="group"><SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="group">Grupe</SelectItem>
            <SelectItem value="r32">32-imi</SelectItem>
            <SelectItem value="r16">16-imi</SelectItem>
            <SelectItem value="qf">Sferturi</SelectItem>
            <SelectItem value="sf">Semifinale</SelectItem>
            <SelectItem value="third_place">Locul 3</SelectItem>
            <SelectItem value="final">Finală</SelectItem>
          </SelectContent>
        </Select>
        <Input name="venue" placeholder="Stadion" className="md:col-span-2" />
        <Button type="submit" className="md:col-span-2">Adaugă meci</Button>
      </form>
      <div className="space-y-1">
        {matches.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded border p-2 text-xs">
            <span>{new Date(m.kickoff_at).toLocaleString("ro-RO")} · {m.home_team?.name ?? "?"} vs {m.away_team?.name ?? "?"}</span>
            <Button size="sm" variant="ghost" onClick={async () => {
              if (!confirm("Sigur?")) return;
              await supabase.from("matches").delete().eq("id", m.id); load();
            }}>Șterge</Button>
          </div>
        ))}
      </div>
    </CardContent></Card>
  );
}

function SettingsTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [s, setS] = useState({ bonus_lock_at: "", champion_team_id: "", top_scorer_name: "", champion_points: 5, top_scorer_points: 5 });

  const load = async () => {
    const [{ data: t }, { data: cur }] = await Promise.all([
      supabase.from("teams").select("*").order("name"),
      supabase.from("tournament_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    setTeams((t ?? []) as Team[]);
    if (cur) setS({
      bonus_lock_at: cur.bonus_lock_at ? new Date(cur.bonus_lock_at).toISOString().slice(0, 16) : "",
      champion_team_id: cur.champion_team_id ?? "",
      top_scorer_name: cur.top_scorer_name ?? "",
      champion_points: cur.champion_points,
      top_scorer_points: cur.top_scorer_points,
    });
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("tournament_settings").upsert({
      id: 1,
      bonus_lock_at: s.bonus_lock_at ? new Date(s.bonus_lock_at).toISOString() : null,
      champion_team_id: s.champion_team_id || null,
      top_scorer_name: s.top_scorer_name || null,
      champion_points: s.champion_points,
      top_scorer_points: s.top_scorer_points,
    });
    if (error) return toast.error(error.message);
    toast.success("Setări salvate");
  };

  return (
    <Card><CardContent className="space-y-3 pt-6">
      <form method="post" onSubmit={save} className="space-y-3">
        <div><Label>Deadline bonus (lock)</Label><Input type="datetime-local" value={s.bonus_lock_at} onChange={(e) => setS({ ...s, bonus_lock_at: e.target.value })} /></div>
        <div><Label>Câștigător real (campion)</Label>
          <Select value={s.champion_team_id} onValueChange={(v) => setS({ ...s, champion_team_id: v })}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Golgheter real</Label><Input value={s.top_scorer_name} onChange={(e) => setS({ ...s, top_scorer_name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Pct campion</Label><Input type="number" value={s.champion_points} onChange={(e) => setS({ ...s, champion_points: Number(e.target.value) })} /></div>
          <div><Label>Pct golgheter</Label><Input type="number" value={s.top_scorer_points} onChange={(e) => setS({ ...s, top_scorer_points: Number(e.target.value) })} /></div>
        </div>
        <Button type="submit">Salvează</Button>
      </form>
    </CardContent></Card>
  );
}
