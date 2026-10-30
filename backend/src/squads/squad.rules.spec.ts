import { describe, expect, it } from "@jest/globals";

import { rejectAdd, rejectRoster } from "./squad.rules";

describe("squad rules", () => {
  it("rejects a seventh member and a duplicate", () => {
    expect(rejectAdd([1, 2, 3, 4, 5, 6], 7)).toBe("SQUAD_FULL");
    expect(rejectAdd([1, 2], 1)).toBe("DUPLICATE_MEMBER");
    expect(rejectAdd([1], 2)).toBeNull();
  });

  it("prefers the duplicate error when the squad is already full", () => {
    expect(rejectAdd([1, 2, 3, 4, 5, 6], 1)).toBe("DUPLICATE_MEMBER");
  });

  it("rejects a roster that is too long or repeats an id", () => {
    expect(rejectRoster([1, 2, 3, 4, 5, 6, 7])).toBe("SQUAD_FULL");
    expect(rejectRoster([1, 1])).toBe("DUPLICATE_MEMBER");
    expect(rejectRoster([])).toBeNull();
    expect(rejectRoster([4, 5, 6])).toBeNull();
  });
});
