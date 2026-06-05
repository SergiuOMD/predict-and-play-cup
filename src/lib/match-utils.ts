export function isMatchLocked(kickoffAt: string): boolean {
  return new Date(kickoffAt).getTime() - Date.now() < 60 * 60 * 1000;
}

export function isMatchOpen(
  status: string,
  kickoffAt: string,
  homeScore: number | null,
): boolean {
  return getMatchStatus(status, kickoffAt, homeScore) === "open";
}

export function getMatchStatus(
  status: string,
  kickoffAt: string,
  homeScore: number | null,
): "open" | "locked" | "finished" | "live" {
  if (status === "live") return "live";
  if (status === "finished" && homeScore !== null) return "finished";
  if (isMatchLocked(kickoffAt)) return "locked";
  return "open";
}

/** Culori WC2026 rotative pentru header-ele grupelor */
export function groupAccentColor(letter: string): string {
  const palette = ["var(--wc-hermes)", "var(--wc-green)", "var(--wc-red)", "#3d52b5", "#2d7a2c"];
  const idx = letter.charCodeAt(0) % palette.length;
  return palette[idx] ?? palette[0];
}
