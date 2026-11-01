import { ACCESS_COOKIE } from "@/auth/auth.cookies";

export function readAccessToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }

  for (const part of header.split(";")) {
    const pieces = part.trim().split("=");
    const name = pieces[0];

    if (name !== ACCESS_COOKIE) {
      continue;
    }

    const value = pieces.slice(1).join("=");

    if (value.length === 0) {
      return null;
    }

    return decodeURIComponent(value);
  }

  return null;
}
