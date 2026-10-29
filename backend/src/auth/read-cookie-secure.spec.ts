import { describe, expect, it } from "@jest/globals";

import { readCookieSecure } from "./read-cookie-secure";

describe("readCookieSecure", () => {
  it("defaults to false when the variable is missing", () => {
    expect(readCookieSecure(undefined)).toBe(false);
    expect(readCookieSecure("")).toBe(false);
  });

  it("reads the string values from the env file", () => {
    expect(readCookieSecure("true")).toBe(true);
    expect(readCookieSecure("false")).toBe(false);
  });

  it("rejects anything else", () => {
    expect(() => readCookieSecure("yes")).toThrow(
      "COOKIE_SECURE must be true or false",
    );
  });
});
