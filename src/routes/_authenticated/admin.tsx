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
import { runAutoScoreSyncAdmin } from "@/lib/scores-cron.functions";
import { importPlayersFromApi, importPlayersFromFile } from "@/lib/players.functions";
import { PlayerPicker } from "@/components/app/player-picker";
import { PageHeader } from "@/components/app/page-header";
import { TeamFlag } from "@/components/app/team-flag";
import { resolveFlagEmoji } from "@/lib/team-flags";
import { Badge } from "@/components/ui/badge";
import { Shield, Trash2, UserX, UserCheck } from "lucide-react";
import { isMatchOpen } from "@/lib/match-utils";
import { formatPredictionScoresCsv } from "@/lib/prediction-utils";

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
        description="Gestionare meciuri, pronosticuri, utilizatori și setări turneu."
        icon={<Shield className="h-5 w-5 text-white" />}
      />
      <ImportFixturesCard />
      <Tabs defaultValue="scores">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="scores">Scoruri</TabsTrigger>
          <TabsTrigger value="predictions">Pronosticuri</TabsTrigger>
          <TabsTrigger value="users">Utilizatori</TabsTrigger>
          <TabsTrigger value="players">Jucători</TabsTrigger>
          <TabsTrigger value="teams">Echipe</TabsTrigger>
          <TabsTrigger value="matches">Meciuri</TabsTrigger>
          <TabsTrigger value="settings">Setări bonus</TabsTrigger>
        </TabsList>
        <TabsContent value="scores"><ScoresTab /></TabsContent>
        <TabsContent value="predictions"><PredictionsTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="players"><PlayersTab /></TabsContent>
        <TabsContent value="teams"><TeamsTab /></TabsContent>
        <TabsContent value="matches"><MatchesTab /></TabsContent>
        <TabsContent value="settings"><SettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ImportFixturesCard() {
  const importFn = useServerFn(importFixtures);
  const autoSyncFn = useServerFn(runAutoScoreSyncAdmin);
  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);

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

  const runAutoSync = async () => {
    setAutoLoading(true);
    try {
      const r = await autoSyncFn();
      toast.success(r.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare la sync auto");
    } finally {
      setAutoLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Import & sync scoruri (football-data.org)</CardTitle>
        <CardDescription>
          Import manual fixtures sau verificare automată programată la +3h și +4h după kickoff
          (Edge Function <code className="text-xs">sync-match-scores</code>, cron la 15 min).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button onClick={run} disabled={loading}>
          {loading ? "Se importă..." : "Importă fixtures"}
        </Button>
        <Button variant="outline" onClick={runAutoSync} disabled={autoLoading}>
          {autoLoading ? "Se verifică..." : "Rulează sync auto (test)"}
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
    const name = String(fd.get("name"));
    const code = String(fd.get("code")) || null;
    const { error } = await supabase.from("teams").insert({
      name,
      code,
      flag_emoji: String(fd.get("flag")) || resolveFlagEmoji(code, name),
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
            <span className="flex items-center gap-2">
              <TeamFlag code={t.code} name={t.name} emoji={t.flag_emoji} size="sm" />
              {t.name}
              {t.group_letter && <span className="text-muted-foreground">· Grupa {t.group_letter}</span>}
            </span>
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

type PredictionRow = {
  id: string;
  user_id: string;
  match_id: string;
  score1_home: number;
  score1_away: number;
  score2_home: number;
  score2_away: number;
  score3_home: number;
  score3_away: number;
  updated_at: string;
  profile: { display_name: string; email: string; disqualified: boolean } | null;
  match: {
    kickoff_at: string;
    home_team_label: string | null;
    away_team_label: string | null;
    home_team: { name: string } | null;
    away_team: { name: string } | null;
  } | null;
};

function PredictionsTab() {
  const [rows, setRows] = useState<PredictionRow[]>([]);
  const [openMatchCount, setOpenMatchCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: matches } = await supabase
      .from("matches")
      .select("id,kickoff_at,status,home_score")
      .order("kickoff_at");

    const openIds = ((matches ?? []) as Array<{ id: string; kickoff_at: string; status: string; home_score: number | null }>)
      .filter((m) => isMatchOpen(m.status, m.kickoff_at, m.home_score))
      .map((m) => m.id);

    setOpenMatchCount(openIds.length);

    if (openIds.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const [{ data: preds, error: predError }, { data: matchRows }] = await Promise.all([
      supabase
        .from("predictions")
        .select("id,user_id,match_id,score1_home,score1_away,score2_home,score2_away,score3_home,score3_away,updated_at")
        .in("match_id", openIds)
        .order("updated_at", { ascending: false }),
      supabase
        .from("matches")
        .select("id,kickoff_at,home_team_label,away_team_label,home_team:teams!matches_home_team_id_fkey(name),away_team:teams!matches_away_team_id_fkey(name)")
        .in("id", openIds),
    ]);

    if (predError) {
      toast.error(predError.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const predList = preds ?? [];
    const matchMap = new Map((matchRows ?? []).map((m) => [m.id, m]));
    const userIds = [...new Set(predList.map((p) => p.user_id))];
    const { data: profs } = userIds.length > 0
      ? await supabase.from("profiles").select("id,display_name,email,disqualified").in("id", userIds)
      : { data: [] };
    const profMap = new Map((profs ?? []).map((p) => [p.id, p]));

    setRows(predList.map((p) => ({
      ...p,
      profile: profMap.get(p.user_id) ?? null,
      match: matchMap.get(p.match_id) ?? null,
    })) as PredictionRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string, userName: string) => {
    if (!confirm(`Ștergi pronosticul lui ${userName}?`)) return;
    const { error } = await supabase.from("predictions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Pronostic șters");
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pronosticuri active</CardTitle>
        <CardDescription>
          {openMatchCount} meciuri deschise · {rows.length} pronosticuri înregistrate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && <p className="text-muted-foreground">Se încarcă...</p>}
        {!loading && rows.length === 0 && (
          <p className="text-muted-foreground">Niciun pronostic pentru meciurile deschise.</p>
        )}
        {rows.map((r) => {
          const home = r.match?.home_team?.name ?? r.match?.home_team_label ?? "?";
          const away = r.match?.away_team?.name ?? r.match?.away_team_label ?? "?";
          const kickoff = r.match?.kickoff_at
            ? new Date(r.match.kickoff_at).toLocaleString("ro-RO")
            : "—";
          return (
            <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 font-semibold">
                  <span>{r.profile?.display_name ?? "Utilizator"}</span>
                  {r.profile?.disqualified && (
                    <Badge variant="outline" className="border-[var(--wc-red)]/30 text-[var(--wc-red)]">
                      Descalificat
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{r.profile?.email}</p>
                <p className="mt-1 text-xs">
                  {kickoff} · {home} vs {away}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{formatPredictionScoresCsv(r)}</p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="gap-1"
                onClick={() => remove(r.id, r.profile?.display_name ?? "utilizator")}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Șterge
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

type ProfileRow = {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  disqualified: boolean;
  disqualified_at: string | null;
  disqualified_reason: string | null;
};

function UsersTab() {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    setMyId(u.user?.id ?? null);

    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,display_name,created_at,disqualified,disqualified_at,disqualified_reason")
      .order("display_name");

    if (error) toast.error(error.message);
    setUsers((data ?? []) as ProfileRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const disqualify = async (user: ProfileRow) => {
    if (user.id === myId) return toast.error("Nu te poți descalifica pe tine însuți.");
    const reason = prompt(`Motiv descalificare pentru ${user.display_name}:`, "");
    if (reason === null) return;
    const { error } = await supabase.from("profiles").update({
      disqualified: true,
      disqualified_at: new Date().toISOString(),
      disqualified_reason: reason.trim() || null,
    }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success(`${user.display_name} a fost descalificat`);
    load();
  };

  const requalify = async (user: ProfileRow) => {
    if (!confirm(`Reintroduci pe ${user.display_name} în competiție?`)) return;
    const { error } = await supabase.from("profiles").update({
      disqualified: false,
      disqualified_at: null,
      disqualified_reason: null,
    }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success(`${user.display_name} a fost reintrodus`);
    load();
  };

  const activeCount = users.filter((u) => !u.disqualified).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Utilizatori</CardTitle>
        <CardDescription>
          {users.length} înscriși · {activeCount} activi · {users.length - activeCount} descalificați
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && <p className="text-muted-foreground">Se încarcă...</p>}
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 font-semibold">
                <span>{u.display_name}</span>
                {u.disqualified ? (
                  <Badge variant="outline" className="border-[var(--wc-red)]/30 bg-[#fde8e9] text-[var(--wc-red)]">
                    Descalificat
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-[var(--wc-green)]/30 bg-[#e8f5e8] text-[#2d7a2c]">
                    Activ
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{u.email}</p>
              {u.disqualified && u.disqualified_reason && (
                <p className="mt-1 text-xs text-[var(--wc-red)]">Motiv: {u.disqualified_reason}</p>
              )}
            </div>
            <div className="flex gap-2">
              {u.disqualified ? (
                <Button size="sm" variant="outline" className="gap-1" onClick={() => requalify(u)}>
                  <UserCheck className="h-3.5 w-3.5" />
                  Reintrodu
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1"
                  disabled={u.id === myId}
                  onClick={() => disqualify(u)}
                >
                  <UserX className="h-3.5 w-3.5" />
                  Descalifică
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PlayersTab() {
  const importApiFn = useServerFn(importPlayersFromApi);
  const importFileFn = useServerFn(importPlayersFromFile);
  const [count, setCount] = useState<number | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);

  const loadCount = async () => {
    const { count: c } = await supabase.from("players").select("id", { count: "exact", head: true });
    setCount(c ?? 0);
  };

  useEffect(() => { loadCount(); }, []);

  const runApiImport = async () => {
    setApiLoading(true);
    try {
      const r = await importApiFn();
      toast.success(r.message);
      loadCount();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare la import API");
    } finally {
      setApiLoading(false);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLoading(true);
    try {
      const content = await file.text();
      const format = file.name.toLowerCase().endsWith(".json") ? "json" as const : "csv" as const;
      const r = await importFileFn({ data: { content, format } });
      toast.success(r.message);
      loadCount();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la import fișier");
    } finally {
      setFileLoading(false);
      e.target.value = "";
    }
  };

  const clearAll = async () => {
    if (!confirm("Ștergi toți jucătorii importați?")) return;
    const { error } = await supabase.from("players").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) return toast.error(error.message);
    toast.success("Lista de jucători a fost golită");
    loadCount();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Jucători (golgheter)</CardTitle>
        <CardDescription>
          {count === null ? "Se încarcă..." : `${count} jucători în baza de date`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Import din API (football-data.org)</p>
          <p className="mt-1">
            Endpoint: <code className="text-xs">/competitions/WC/teams?season=2026</code> sau lot per echipă.
            Loturile WC2026 pot fi indisponibile încă — în acest caz folosește import manual.
          </p>
          <Button className="mt-3" onClick={runApiImport} disabled={apiLoading}>
            {apiLoading ? "Se importă (poate dura câteva minute)..." : "Importă jucători din API"}
          </Button>
        </div>

        <div className="rounded-lg border p-4 text-sm">
          <p className="font-medium">Import manual CSV / JSON</p>
          <p className="mt-1 text-muted-foreground">
            CSV: <code className="text-xs">name,team,position</code> sau doar <code className="text-xs">name</code> pe linie.
          </p>
          <p className="mt-1 text-muted-foreground">
            JSON: array de obiecte cu câmpurile <code className="text-xs">name</code>, opțional <code className="text-xs">team</code> sau <code className="text-xs">team_code</code>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild variant="outline" disabled={fileLoading}>
              <label className="cursor-pointer">
                {fileLoading ? "Se importă..." : "Alege fișier CSV/JSON"}
                <input type="file" accept=".csv,.json,.txt" className="hidden" onChange={onFile} />
              </label>
            </Button>
            <Button variant="ghost" onClick={clearAll} disabled={!count}>
              Golește lista
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
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
        <div>
          <Label>Golgheter real</Label>
          <PlayerPicker
            value={s.top_scorer_name}
            onChange={(v) => setS({ ...s, top_scorer_name: v })}
            placeholder="Alege golgheterul real"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Pct campion</Label><Input type="number" value={s.champion_points} onChange={(e) => setS({ ...s, champion_points: Number(e.target.value) })} /></div>
          <div><Label>Pct golgheter</Label><Input type="number" value={s.top_scorer_points} onChange={(e) => setS({ ...s, top_scorer_points: Number(e.target.value) })} /></div>
        </div>
        <Button type="submit">Salvează</Button>
      </form>
    </CardContent></Card>
  );
}
