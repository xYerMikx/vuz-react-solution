import type { Response } from "supertest";

export function cookieLines(response: Response): string[] {
  const header = response.headers["set-cookie"];

  if (Array.isArray(header)) {
    return header;
  }

  if (typeof header === "string") {
    return [header];
  }

  return [];
}

export function cookieValue(response: Response, name: string): string {
  const line = cookieLines(response).find((item) =>
    item.startsWith(`${name}=`),
  );

  if (!line) {
    throw new Error(`Missing ${name} cookie`);
  }

  const pair = line.split(";")[0];

  if (!pair) {
    throw new Error(`Missing ${name} cookie`);
  }

  return pair.slice(name.length + 1);
}
