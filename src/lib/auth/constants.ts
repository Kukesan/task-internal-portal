// Edge-safe constants (imported by middleware, so no Node or Prisma imports here).

/** `__Host-` forces Secure, Path=/ and no Domain; browsers only accept it over HTTPS. */
export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-portal_session" : "portal_session";

export const PROTECTED_PREFIXES = ["/tasks"];
export const AUTH_PAGES = ["/login", "/signup"];
export const DEFAULT_AUTHENTICATED_PATH = "/tasks";

/** Only allow same-site relative redirects after login (prevents open redirects). */
export function safeRedirectPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return DEFAULT_AUTHENTICATED_PATH;
  }
  return next;
}
