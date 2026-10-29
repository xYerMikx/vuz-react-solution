export interface NameCursor {
  name: string;
  id: number;
}

export interface IdCursor {
  id: number;
}

export class InvalidCursorError extends Error {
  constructor() {
    super("Invalid cursor");
  }
}

export function encodeCursor(cursor: NameCursor | IdCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function encodePageCursor(
  row: { id: number; name: string },
  sort: "name" | "id",
): string {
  return encodeCursor(
    sort === "id" ? { id: row.id } : { name: row.name, id: row.id },
  );
}

export function decodeCursor(cursor: string, sort: "name"): NameCursor;
export function decodeCursor(cursor: string, sort: "id"): IdCursor;
export function decodeCursor(
  cursor: string,
  sort: "name" | "id",
): NameCursor | IdCursor {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
  } catch {
    throw new InvalidCursorError();
  }

  if (sort === "id") {
    if (!isIdCursor(parsed)) throw new InvalidCursorError();
    return { id: parsed.id };
  }

  if (!isNameCursor(parsed)) throw new InvalidCursorError();
  return { name: parsed.name, id: parsed.id };
}

function isIdCursor(value: unknown): value is IdCursor {
  return isRecord(value) && Number.isInteger(value.id);
}

function isNameCursor(value: unknown): value is NameCursor {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    Number.isInteger(value.id)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
