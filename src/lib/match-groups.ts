import { getMatchStatus } from "@/lib/match-utils";

export type MatchDayLike = {
  kickoff_at: string;
  status: string;
  home_score: number | null;
};

export type MatchDayGroup<T extends MatchDayLike> = {
  key: string;
  label: string;
  matches: T[];
};

export function formatMatchDayLabel(kickoffAt: string): string {
  return new Date(kickoffAt).toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function groupMatchesByDay<T extends MatchDayLike>(matches: T[]): MatchDayGroup<T>[] {
  const order: string[] = [];
  const map = new Map<string, MatchDayGroup<T>>();

  for (const match of matches) {
    const label = formatMatchDayLabel(match.kickoff_at);
    let group = map.get(label);
    if (!group) {
      group = { key: label, label, matches: [] };
      map.set(label, group);
      order.push(label);
    }
    group.matches.push(match);
  }

  return order.map((label) => map.get(label)!);
}

export function isMatchFinished(m: MatchDayLike): boolean {
  return getMatchStatus(m.status, m.kickoff_at, m.home_score) === "finished";
}

export function isDayFullyFinished(matches: MatchDayLike[]): boolean {
  return matches.length > 0 && matches.every(isMatchFinished);
}

export function openDayKeys(groups: MatchDayGroup<MatchDayLike>[]): string[] {
  return groups.filter((g) => !isDayFullyFinished(g.matches)).map((g) => g.key);
}

export function formatDaySummary(matches: MatchDayLike[]): string {
  const total = matches.length;
  const finished = matches.filter(isMatchFinished).length;
  if (finished === total) {
    return `${total} ${total === 1 ? "meci finalizat" : "meciuri finalizate"}`;
  }
  const pending = total - finished;
  return `${total} meciuri · ${pending} ${pending === 1 ? "rămas" : "rămase"}`;
}
