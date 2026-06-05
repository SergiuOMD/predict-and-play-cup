import type { Database } from "@/integrations/supabase/types";

type MatchStage = Database["public"]["Enums"]["match_stage"];
type MatchStatus = Database["public"]["Enums"]["match_status"];

const STAGE_MAP: Record<string, MatchStage> = {
  GROUP_STAGE: "group",
  LAST_32: "r32",
  LAST_16: "r16",
  QUARTER_FINALS: "qf",
  SEMI_FINALS: "sf",
  THIRD_PLACE: "third_place",
  FINAL: "final",
};

const STATUS_MAP: Record<string, MatchStatus> = {
  SCHEDULED: "scheduled",
  TIMED: "scheduled",
  IN_PLAY: "live",
  PAUSED: "live",
  FINISHED: "finished",
  POSTPONED: "postponed",
  SUSPENDED: "postponed",
  CANCELLED: "postponed",
};

export function mapStage(apiStage: string): MatchStage {
  return STAGE_MAP[apiStage] ?? "group";
}

export function mapStatus(apiStatus: string): MatchStatus {
  return STATUS_MAP[apiStatus] ?? "scheduled";
}

export function mapGroupLetter(apiGroup: string | null): string | null {
  if (!apiGroup?.startsWith("GROUP_")) return null;
  return apiGroup.replace("GROUP_", "");
}
