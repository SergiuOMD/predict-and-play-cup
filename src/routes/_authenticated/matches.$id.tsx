import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MatchStatusBadge } from "@/components/app/match-status-badge";
import { TeamFlag } from "@/components/app/team-flag";
import { getMatchStatus } from "@/lib/match-utils";
import { toast } from "sonner";
import { ArrowLeft, Users } from "lucide-react";
import { cn } from "@/lib/utils";

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
  home_team: { name: string; code: string | null; flag_emoji: string | null } | null;
  away_team: { name: string; code: string | null; flag_emoji: string | null } | null;
};
type Pred = {
  score1_home: string; score1_away: string;
  score2_home: string; score2_away: string;
  score3_home: string; score3_away: string;
  points: number;
};

const EMPTY_PRED: Pred = {
  score1_home: "", score1_away: "",
  score2_home: "", score2_away: "",
  score3_home: "", score3_away: "",
  points: 0,
};

function predFromDb(row: {
  score1_home: number; score1_away: number;
  score2_home: number; score2_away: number;
  score3_home: number; score3_away: number;
  points: number;
}): Pred {
  return {
    score1_home: String(row.score1_home), score1_away: String(row.score1_away),
    score2_home: String(row.score2_home), score2_away: String(row.score2_away),
    score3_home: String(row.score3_home), score3_away: String(row.score3_away),
    points: row.points,
  };
}

function parseScore(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 0 || n > 30) return null;
  return n;
}

export const Route = createFileRoute("/_authenticated/matches/$id")({
  component: MatchDetail,
});

function MatchDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [pred, setPred] = useState<Pred>(EMPTY_PRED);
  const [hasPred, setHasPred] = useState(false);
  const [allPreds, setAllPreds] = useState<Array<{
    display_name: string;
    score1_home: number; score1_away: number;
    score2_home: number; score2_away: number;
    score3_home: number; score3_away: number;
    points: number;
  }>>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disqualified, setDisqualified] = useState(false);
  const [disqualifyReason, setDisqualifyReason] = useState<string | null>(null);

  const load = async () => {
    const { data: m, error } = await supabase
      .from("matches")
      .select("id,kickoff_at,status,group_letter,stage,home_score,away_score,home_team_label,away_team_label,home_team:teams!matches_home_team_id_fkey(name,code,flag_emoji),away_team:teams!matches_away_team_id_fkey(name,code,flag_emoji)")
      .eq("id", id).maybeSingle();
    setLoading(false);
    if (error || !m) {
      setMatch(null);
      return;
    }
    setMatch(m as unknown as Match);

    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      const [{ data: p }, { data: prof }] = await Promise.all([
        supabase.from("predictions").select("score1_home,score1_away,score2_home,score2_away,score3_home,score3_away,points").eq("match_id", id).eq("user_id", u.user.id).maybeSingle(),
        supabase.from("profiles").select("disqualified,disqualified_reason").eq("id", u.user.id).maybeSingle(),
      ]);
      if (p) { setPred(predFromDb(p)); setHasPred(true); }
      setDisqualified(!!prof?.disqualified);
      setDisqualifyReason(prof?.disqualified_reason ?? null);
    }

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

  if (loading) {
    return (
      <div className="app-card animate-pulse p-12 text-center text-muted-foreground">Se încarcă...</div>
    );
  }

  if (!match) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-[var(--wc-hermes)]"
          onClick={() => navigate({ to: "/matches" })}
        >
          <ArrowLeft className="h-4 w-4" /> Înapoi la meciuri
        </Button>
        <div className="app-card p-10 text-center text-muted-foreground">Meciul nu a fost găsit.</div>
      </div>
    );
  }

  const matchStatus = getMatchStatus(match.status, match.kickoff_at, match.home_score);
  const locked = matchStatus === "locked" || matchStatus === "finished" || matchStatus === "live" || disqualified;
  const finished = matchStatus === "finished";
  const homeName = match.home_team?.name ?? match.home_team_label ?? "TBD";
  const awayName = match.away_team?.name ?? match.away_team_label ?? "TBD";
  const homeCode = match.home_team?.code ?? null;
  const awayCode = match.away_team?.code ?? null;
  const homeFlag = match.home_team?.flag_emoji ?? null;
  const awayFlag = match.away_team?.flag_emoji ?? null;
  const scoreStr = finished ? `${match.home_score}-${match.away_score}` : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const score1_home = parseScore(pred.score1_home);
    const score1_away = parseScore(pred.score1_away);
    const score2_home = parseScore(pred.score2_home);
    const score2_away = parseScore(pred.score2_away);
    const score3_home = parseScore(pred.score3_home);
    const score3_away = parseScore(pred.score3_away);

    if ([score1_home, score1_away, score2_home, score2_away, score3_home, score3_away].some((v) => v === null)) {
      return toast.error("Completează toate cele 6 scoruri (0–30).");
    }

    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setSaving(false);
      return;
    }
    const payload = {
      score1_home: score1_home!,
      score1_away: score1_away!,
      score2_home: score2_home!,
      score2_away: score2_away!,
      score3_home: score3_home!,
      score3_away: score3_away!,
      user_id: u.user.id,
      match_id: id,
    };
    const { error } = hasPred
      ? await supabase.from("predictions").update(payload).eq("user_id", u.user.id).eq("match_id", id)
      : await supabase.from("predictions").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Pronosticuri salvate!");
    setHasPred(true);
    setPred((prev) => ({
      ...prev,
      score1_home: String(score1_home),
      score1_away: String(score1_away),
      score2_home: String(score2_home),
      score2_away: String(score2_away),
      score3_home: String(score3_home),
      score3_away: String(score3_away),
    }));
  };

  const numField = (key: keyof Pred) => (
    <Input
      type="number"
      min={0}
      max={30}
      inputMode="numeric"
      placeholder="—"
      className="h-12 w-14 border-[var(--wc-light-gray)] text-center text-lg font-bold placeholder:font-normal placeholder:text-muted-foreground/50"
      value={pred[key] as string}
      onChange={(e) => setPred({ ...pred, [key]: e.target.value })}
      disabled={locked}
    />
  );

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 text-[var(--wc-hermes)] hover:bg-[var(--wc-hermes)]/10"
        onClick={() => navigate({ to: "/matches" })}
      >
        <ArrowLeft className="h-4 w-4" /> Înapoi la meciuri
      </Button>

      {/* Hero meci */}
      <div className="app-card overflow-hidden">
        <div className="bg-gradient-hermes px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {match.group_letter && (
              <Badge className="bg-white/15 text-white hover:bg-white/15">Grupa {match.group_letter}</Badge>
            )}
            <MatchStatusBadge
              status={matchStatus}
              score={scoreStr}
              className="border-white/30 bg-white/10 text-white"
            />
          </div>
          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
            <div className="flex flex-col items-center sm:items-end">
              <TeamFlag code={homeCode} name={homeName} emoji={homeFlag} size="xl" />
              <p className="mt-2 text-lg font-bold sm:text-xl">{homeName}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-6 py-4 text-center backdrop-blur">
              {finished ? (
                <p className="text-4xl font-black tabular-nums">{match.home_score} - {match.away_score}</p>
              ) : (
                <p className="text-3xl font-black">VS</p>
              )}
              <p className="mt-1 text-xs text-white/70">
                {new Date(match.kickoff_at).toLocaleString("ro-RO")}
              </p>
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <TeamFlag code={awayCode} name={awayName} emoji={awayFlag} size="xl" />
              <p className="mt-2 text-lg font-bold sm:text-xl">{awayName}</p>
            </div>
          </div>
        </div>
      </div>

      {disqualified && (
        <div className="rounded-xl border border-[var(--wc-red)]/30 bg-[#fde8e9] px-4 py-3 text-sm text-[var(--wc-red)]">
          <p className="font-semibold">Cont descalificat din competiție</p>
          {disqualifyReason && <p className="mt-1 text-xs opacity-90">Motiv: {disqualifyReason}</p>}
          <p className="mt-1 text-xs opacity-90">Nu mai poți trimite sau modifica pronosticuri.</p>
        </div>
      )}

      {/* Formular pronosticuri */}
      <div className="app-card p-6 sm:p-8">
        <h2 className="text-lg font-bold text-[var(--wc-hermes)]">Pronosticurile tale</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Introdu 3 scoruri. 1 punct pentru fiecare exact (max 3 puncte).
          {matchStatus === "locked" && !disqualified && (
            <span className="ml-1 font-medium text-[var(--wc-red)]">
              Blocate cu 1h înainte de kickoff.
            </span>
          )}
        </p>

        <form method="post" onSubmit={submit} className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--wc-light-gray)] bg-muted/30 p-4"
            >
              <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-[var(--wc-hermes)]">
                Pronostic {i}
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="hidden w-28 truncate text-right text-sm font-medium sm:inline">{homeName}</span>
                <div className="flex items-center gap-2">
                  {numField(`score${i}_home` as keyof Pred)}
                  <span className="text-lg font-bold text-muted-foreground">:</span>
                  {numField(`score${i}_away` as keyof Pred)}
                </div>
                <span className="hidden w-28 truncate text-sm font-medium sm:inline">{awayName}</span>
              </div>
            </div>
          ))}

          {!locked && (
            <Button type="submit" disabled={saving} className="h-12 w-full bg-gradient-hermes text-base font-semibold hover:opacity-90">
              {saving ? "Se salvează..." : hasPred ? "Actualizează pronosticurile" : "Trimite pronosticurile"}
            </Button>
          )}

          {hasPred && finished && (
            <div className="rounded-lg bg-[var(--wc-green)]/10 px-4 py-3 text-center">
              Ai obținut{" "}
              <span className="text-xl font-black text-[var(--wc-green)]">{pred.points}</span>{" "}
              {pred.points === 1 ? "punct" : "puncte"}
            </div>
          )}
        </form>
      </div>

      {(locked || finished) && allPreds.length > 0 && (
        <div className="app-card overflow-hidden">
          <div className="flex items-center gap-2 border-b bg-[var(--wc-hermes)]/5 px-5 py-3">
            <Users className="h-4 w-4 text-[var(--wc-hermes)]" />
            <h2 className="font-bold text-[var(--wc-hermes)]">Pronosticurile tuturor</h2>
          </div>
          <div className="divide-y">
            {allPreds.sort((a, b) => b.points - a.points).map((p, i) => (
              <div key={i} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-semibold">{p.display_name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {p.score1_home}-{p.score1_away} · {p.score2_home}-{p.score2_away} · {p.score3_home}-{p.score3_away}
                </span>
                <Badge
                  className={cn(
                    "w-fit font-bold",
                    p.points > 0 ? "bg-[var(--wc-green)] hover:bg-[var(--wc-green)]" : "bg-muted text-muted-foreground",
                  )}
                >
                  {p.points} pct
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
