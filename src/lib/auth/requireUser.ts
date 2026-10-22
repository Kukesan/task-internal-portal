import "server-only";
import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/auth/cookies";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { UnauthenticatedError } from "@/lib/errors";
import type { PublicUser } from "@/lib/types";

/** For route handlers: throws a 401 AppError when there is no valid session. */
export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

/** For server components: redirects to sign-in when there is no valid session. */
export async function requirePageUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (user) return user;

  // A cookie that no longer maps to a session (expired/revoked) must be cleared, or middleware
  // would bounce between /login and /tasks. Server components can't write cookies, so a route
  // handler does it.
  if (await readSessionCookie()) redirect("/api/auth/session-expired");
  redirect("/login");
}
