import "server-only";
import { cache } from "react";
import { readSessionCookie } from "@/server/auth/cookies";
import { validateSessionToken } from "@/server/auth/session";
import type { PublicUser } from "@/lib/types";

/**
 * Resolves the signed-in user from the session cookie, validated against the database.
 * Wrapped in React `cache` so layouts and pages in one request share a single lookup.
 */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const token = await readSessionCookie();
  if (!token) return null;
  return validateSessionToken(token);
});
