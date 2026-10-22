import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/auth/cookies";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

/**
 * Landing point when a page finds a session cookie that no longer maps to a valid session.
 * Clears the stale cookie (server components can't) and sends the user to sign in.
 * A still-valid session is left untouched, so this can't be abused to log someone out.
 */
export async function GET(req: NextRequest) {
  if (await getCurrentUser()) {
    return NextResponse.redirect(new URL("/tasks", req.url), 303);
  }
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login?expired=1", req.url), 303);
}
