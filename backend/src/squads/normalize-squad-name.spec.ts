import { describe, expect, it } from "@jest/globals";

import {
  isSquadNameLengthValid,
  normalizeSquadName,
} from "./normalize-squad-name";

describe("normalizeSquadName", () => {
  it("trims surrounding spaces", () => {
    expect(normalizeSquadName("  Earthrealm  ")).toBe("Earthrealm");
  });

  it("rejects an empty name and a name past 40 characters", () => {
    expect(isSquadNameLengthValid("")).toBe(false);
    expect(isSquadNameLengthValid("a".repeat(41))).toBe(false);
    expect(isSquadNameLengthValid("Defenders")).toBe(true);
  });
});
