import { describe, expect, it } from "@jest/globals";

import { normalizeEmail } from "./normalize-email";

describe("normalizeEmail", () => {
  it("trims and lowercases the address", () => {
    expect(normalizeEmail("  Fighter@Example.com ")).toBe(
      "fighter@example.com",
    );
  });
});
