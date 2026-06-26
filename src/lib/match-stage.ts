import type { Database } from "@/integrations/supabase/types";

export type MatchStage = Database["public"]["Enums"]["match_stage"];

const STAGE_LABELS: Record<MatchStage, string> = {
  group: "Grupa",
  r32: "32-imi",
  r16: "16-imi",
  qf: "Sferturi",
  sf: "Semifinale",
  third_place: "Locul 3",
  final: "Finală",
};

export function isGroupStage(stage: string): boolean {
  return stage === "group";
}

export function isKnockoutStage(stage: string): boolean {
  return stage !== "group";
}

export function getStageLabel(stage: string): string {
  return STAGE_LABELS[stage as MatchStage] ?? stage;
}

export function getMatchPhaseLabel(stage: string, groupLetter: string | null): string {
  if (isGroupStage(stage) && groupLetter) return `Grupa ${groupLetter}`;
  return getStageLabel(stage);
}

export function partitionMatchesByPhase<T extends { stage: string }>(matches: T[]) {
  const group: T[] = [];
  const knockout: T[] = [];
  for (const match of matches) {
    if (isGroupStage(match.stage)) group.push(match);
    else knockout.push(match);
  }
  return { group, knockout };
}

export function formatKickoffTime(kickoffAt: string): string {
  return new Date(kickoffAt).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

export function formatKickoffDateShort(kickoffAt: string): string {
  return new Date(kickoffAt).toLocaleDateString("ro-RO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatKickoffDateTime(kickoffAt: string): string {
  return `${formatKickoffDateShort(kickoffAt)}, ${formatKickoffTime(kickoffAt)}`;
}

export function formatDayTimeRange(matches: { kickoff_at: string }[]): string | null {
  if (matches.length === 0) return null;
  const times = matches.map((m) => formatKickoffTime(m.kickoff_at));
  const first = times[0]!;
  const last = times[times.length - 1]!;
  return first === last ? first : `${first} – ${last}`;
}
