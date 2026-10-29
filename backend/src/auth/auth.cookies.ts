import type { ConfigService } from "@nestjs/config";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

const ACCESS_PATH = "/api/v1";
const REFRESH_PATH = "/api/v1/auth";

interface CookieJar {
  cookie(name: string, value: string, options: SessionCookieOptions): void;
  clearCookie(name: string, options: SessionCookieOptions): void;
}

interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "strict";
  path: string;
  maxAge?: number;
}

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
}

export function writeSessionCookies(
  response: CookieJar,
  config: ConfigService,
  session: IssuedSession,
): void {
  const secure = config.getOrThrow<boolean>("COOKIE_SECURE");
  response.cookie(ACCESS_COOKIE, session.accessToken, {
    ...getSessionCookieOptions(secure, ACCESS_PATH),
    maxAge: config.getOrThrow<number>("JWT_ACCESS_TTL_SECONDS") * 1000,
  });
  response.cookie(REFRESH_COOKIE, session.refreshToken, {
    ...getSessionCookieOptions(secure, REFRESH_PATH),
    maxAge: config.getOrThrow<number>("REFRESH_TTL_SECONDS") * 1000,
  });
}

export function clearSessionCookies(
  response: CookieJar,
  config: ConfigService,
): void {
  const secure = config.getOrThrow<boolean>("COOKIE_SECURE");
  response.clearCookie(
    ACCESS_COOKIE,
    getSessionCookieOptions(secure, ACCESS_PATH),
  );
  response.clearCookie(
    REFRESH_COOKIE,
    getSessionCookieOptions(secure, REFRESH_PATH),
  );
}

function getSessionCookieOptions(
  secure: boolean,
  path: string,
): SessionCookieOptions {
  return { httpOnly: true, secure, sameSite: "strict", path };
}
