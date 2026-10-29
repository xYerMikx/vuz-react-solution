import { describe, expect, it } from "@jest/globals";

import { decodeCursor, encodeCursor, InvalidCursorError } from "./cursor";

describe("cursor", () => {
  it("round-trips a name cursor", () => {
    const cursor = { name: "Scorpion", id: 12 };
    expect(decodeCursor(encodeCursor(cursor), "name")).toEqual(cursor);
  });

  it("round-trips an id cursor", () => {
    const cursor = { id: 12 };
    expect(decodeCursor(encodeCursor(cursor), "id")).toEqual(cursor);
  });

  it("rejects a cursor that is not valid base64 json", () => {
    expect(() => decodeCursor("%%%", "name")).toThrow(InvalidCursorError);
  });

  it("rejects a cursor with the wrong shape", () => {
    const encoded = Buffer.from(JSON.stringify({ name: "Scorpion" })).toString(
      "base64url",
    );
    expect(() => decodeCursor(encoded, "name")).toThrow(InvalidCursorError);
  });
});
