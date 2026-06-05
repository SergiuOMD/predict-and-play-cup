import { describe, expect, it } from "vitest";
import { resolveTeamFlag, resolveTla } from "./team-flags";

describe("team-flags", () => {
  it("rezolvă cod FIFA → imagine flagcdn", () => {
    const mex = resolveTeamFlag("MEX", "Mexico");
    expect(mex.iso).toBe("mx");
    expect(mex.imageUrl).toContain("flagcdn.com/w80/mx.png");
    expect(mex.emoji).toBe("🇲🇽");
  });

  it("rezolvă după nume când lipsește codul", () => {
    expect(resolveTla(null, "Bosnia and Herzegovina")).toBe("BIH");
    expect(resolveTeamFlag(null, "United States").iso).toBe("us");
  });

  it("include Anglia și Scoția", () => {
    expect(resolveTeamFlag("ENG", "England").iso).toBe("gb-eng");
    expect(resolveTeamFlag("SCO", "Scotland").iso).toBe("gb-sct");
  });
});
