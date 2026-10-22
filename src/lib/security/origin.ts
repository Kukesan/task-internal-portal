import { ForbiddenError } from "@/lib/errors";

/**
 * CSRF defence for cookie-authenticated mutations (in addition to SameSite=Lax cookies).
 *
 * - If the browser sends an Origin header it must match the app origin or the request's Host.
 * - If Origin is absent, fall back to Sec-Fetch-Site and reject anything cross-site.
 * - Requests with neither header come from non-browser clients, which cannot carry a victim's
 *   cookies, so they are allowed.
 */
export function assertSameOrigin(headers: Headers, appUrl: string): void {
  const origin = headers.get("origin");
  if (origin) {
    if (!isAllowedOrigin(origin, headers, appUrl)) {
      throw new ForbiddenError("Cross-origin request blocked.");
    }
    return;
  }

  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw new ForbiddenError("Cross-origin request blocked.");
  }
}

function isAllowedOrigin(origin: string, headers: Headers, appUrl: string): boolean {
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }
  if (originUrl.origin === new URL(appUrl).origin) return true;

  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  return host !== null && originUrl.host === host;
}
