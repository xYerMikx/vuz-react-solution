import { describe, expect, it } from "@jest/globals";

import { hashToken } from "./token-hash";

describe("refresh token hash", () => {
  it("is stable for the same token", () => {
    expect(hashToken("same-token")).toBe(hashToken("same-token"));
  });

  it("changes when the token changes", () => {
    expect(hashToken("one")).not.toBe(hashToken("two"));
  });
});
