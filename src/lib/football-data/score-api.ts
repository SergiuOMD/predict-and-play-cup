import type { FootballDataMatch } from "./types";

export type ApiScorePair = { home: number | null; away: number | null };

/** Scor pentru punctaj: 90 min (regularTime), nu prelungiri/penalty. */
export function apiScoreForPoints(match: FootballDataMatch): ApiScorePair {
  const { score } = match;
  const regular = score.regularTime;
  if (regular && (regular.home != null || regular.away != null)) {
    return { home: regular.home, away: regular.away };
  }
  return { home: score.fullTime.home, away: score.fullTime.away };
}

export function isKnockoutApiStage(apiStage: string): boolean {
  return apiStage !== "GROUP_STAGE";
}

export function shouldPreserveScores(
  stage: string,
  scoreLocked: boolean,
): boolean {
  return scoreLocked || stage !== "group";
}

export function shouldAutoSyncScores(
  stage: string,
  scoreLocked: boolean,
): boolean {
  return stage === "group" && !scoreLocked;
}
