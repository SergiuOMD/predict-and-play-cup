export type PlayerImportRow = {
  name: string;
  team?: string | null;
  team_code?: string | null;
  position?: string | null;
  nationality?: string | null;
  shirt_number?: number | null;
};

export function normalizePlayerName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function parsePlayersCsv(content: string): PlayerImportRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  if (lines.length === 0) return [];

  const header = lines[0].toLowerCase();
  const hasHeader = header.includes("name") || header.includes("nume");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
    if (parts.length >= 2 && (hasHeader || parts.length >= 2)) {
      const [name, team, position] = parts;
      return {
        name: normalizePlayerName(name),
        team: team || null,
        position: position || null,
      };
    }
    return { name: normalizePlayerName(parts[0]) };
  }).filter((r) => r.name.length > 0);
}

export function parsePlayersJson(content: string): PlayerImportRow[] {
  const parsed = JSON.parse(content) as unknown;
  const rows = Array.isArray(parsed) ? parsed : (parsed as { players?: unknown }).players;

  if (!Array.isArray(rows)) {
    throw new Error("JSON invalid: așteptat array sau obiect cu câmpul players");
  }

  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    const name = String(r.name ?? r.player ?? r.nume ?? "").trim();
    if (!name) throw new Error("Fiecare jucător trebuie să aibă un nume");

    return {
      name: normalizePlayerName(name),
      team: r.team != null ? String(r.team) : r.team_name != null ? String(r.team_name) : null,
      team_code: r.team_code != null ? String(r.team_code) : r.code != null ? String(r.code) : null,
      position: r.position != null ? String(r.position) : null,
      nationality: r.nationality != null ? String(r.nationality) : null,
      shirt_number: r.shirt_number != null ? Number(r.shirt_number) : r.number != null ? Number(r.number) : null,
    };
  });
}

export function parsePlayersFile(content: string, format: "csv" | "json"): PlayerImportRow[] {
  const rows = format === "json" ? parsePlayersJson(content) : parsePlayersCsv(content);
  if (rows.length === 0) throw new Error("Fișierul nu conține jucători");
  return rows;
}
