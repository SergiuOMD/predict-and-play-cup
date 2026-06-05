import { describe, expect, it } from "vitest";

import { mapGroupLetter, mapStage, mapStatus } from "./mappers";

describe("football-data mappers", () => {
  it("maps stages to DB enum", () => {
    expect(mapStage("GROUP_STAGE")).toBe("group");
    expect(mapStage("LAST_32")).toBe("r32");
    expect(mapStage("FINAL")).toBe("final");
  });

  it("maps statuses to DB enum", () => {
    expect(mapStatus("TIMED")).toBe("scheduled");
    expect(mapStatus("IN_PLAY")).toBe("live");
    expect(mapStatus("FINISHED")).toBe("finished");
  });

  it("maps group letters", () => {
    expect(mapGroupLetter("GROUP_A")).toBe("A");
    expect(mapGroupLetter(null)).toBeNull();
  });
});
