import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_PAGES,
  DEFAULT_AUTHENTICATED_PATH,
  PROTECTED_PREFIXES,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/constants";

/**
 * Optimistic routing only: checks that a session cookie *exists*, without touching the
 * database (middleware runs on the edge runtime). Pages and API handlers re-validate the
 * session against Postgres; this layer just avoids rendering protected pages for anonymous users.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasSessionCookie = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isProtected && !hasSessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_PAGES.includes(pathname) && hasSessionCookie) {
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_PATH, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tasks/:path*", "/login", "/signup"],
};
