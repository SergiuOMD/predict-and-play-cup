import { describe, expect, it } from "vitest";

import { parsePlayersCsv, parsePlayersJson } from "./players-import";

describe("parsePlayersCsv", () => {
  it("parses headered csv", () => {
    const rows = parsePlayersCsv("name,team,position\nLionel Messi,Argentina,Forward");
    expect(rows).toEqual([{ name: "Lionel Messi", team: "Argentina", position: "Forward" }]);
  });

  it("parses name-only lines", () => {
    const rows = parsePlayersCsv("Kylian Mbappé\nHarry Kane");
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe("Kylian Mbappé");
  });
});

describe("parsePlayersJson", () => {
  it("parses player array", () => {
    const rows = parsePlayersJson('[{"name":"Rodri","team_code":"ESP"}]');
    expect(rows[0]).toMatchObject({ name: "Rodri", team_code: "ESP" });
  });
});
