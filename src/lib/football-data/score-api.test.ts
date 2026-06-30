import { describe, expect, it } from "vitest";

import { apiScoreForPoints, shouldAutoSyncScores, shouldPreserveScores } from "./score-api";
import type { FootballDataMatch } from "./types";

function mockMatch(overrides: Partial<FootballDataMatch["score"]> & { stage?: string }): FootballDataMatch {
  const { stage = "GROUP_STAGE", ...scoreParts } = overrides;
  return {
    id: 1,
    utcDate: "2026-06-01T18:00:00Z",
    status: "FINISHED",
    stage,
    group: "GROUP_A",
    homeTeam: { id: 1, name: "A", shortName: "A", tla: "AAA", crest: null },
    awayTeam: { id: 2, name: "B", shortName: "B", tla: "BBB", crest: null },
    score: {
      duration: scoreParts.duration ?? "REGULAR",
      fullTime: scoreParts.fullTime ?? { home: 2, away: 1 },
      regularTime: scoreParts.regularTime ?? null,
      extraTime: scoreParts.extraTime ?? null,
    },
  };
}

describe("apiScoreForPoints", () => {
  it("uses regularTime when present (90 min)", () => {
    const m = mockMatch({
      duration: "PENALTY_SHOOTOUT",
      regularTime: { home: 1, away: 1 },
      fullTime: { home: 2, away: 2 },
    });
    expect(apiScoreForPoints(m)).toEqual({ home: 1, away: 1 });
  });

  it("falls back to fullTime for regular duration", () => {
    const m = mockMatch({ fullTime: { home: 3, away: 0 } });
    expect(apiScoreForPoints(m)).toEqual({ home: 3, away: 0 });
  });
});

describe("shouldPreserveScores", () => {
  it("preserves knockout and locked scores", () => {
    expect(shouldPreserveScores("r16", false)).toBe(true);
    expect(shouldPreserveScores("group", true)).toBe(true);
    expect(shouldPreserveScores("group", false)).toBe(false);
  });
});

describe("shouldAutoSyncScores", () => {
  it("only auto-syncs unlocked group matches", () => {
    expect(shouldAutoSyncScores("group", false)).toBe(true);
    expect(shouldAutoSyncScores("qf", false)).toBe(false);
    expect(shouldAutoSyncScores("group", true)).toBe(false);
  });
});
