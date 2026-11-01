import { describe, expect, it } from "@jest/globals";

import { readAccessToken } from "./read-access-token";

describe("readAccessToken", () => {
  it("returns the access cookie", () => {
    expect(readAccessToken("access_token=abc.def; refresh_token=nope")).toBe(
      "abc.def",
    );
  });

  it("returns null when the header is missing", () => {
    expect(readAccessToken(undefined)).toBeNull();
  });

  it("returns null when only another cookie is present", () => {
    expect(readAccessToken("refresh_token=nope")).toBeNull();
  });

  it("returns null when the access cookie is empty", () => {
    expect(readAccessToken("access_token=")).toBeNull();
  });
});
