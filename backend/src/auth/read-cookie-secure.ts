export function readCookieSecure(value: unknown): boolean {
  if (value === undefined || value === "") {
    return false;
  }

  if (value === true || value === "true") {
    return true;
  }

  if (value === false || value === "false") {
    return false;
  }

  throw new Error("COOKIE_SECURE must be true or false");
}
