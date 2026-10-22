import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";
import type { PublicUser } from "@/lib/types";
import * as sessionRepo from "@/server/repositories/session.repo";

const DAY_MS = 24 * 60 * 60 * 1000;

export type CreatedSession = { token: string; expiresAt: Date };

/** 32 random bytes, base64url-encoded: the raw value that goes in the cookie. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only this hash is stored, so a database leak doesn't expose usable session tokens. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: string,
  now: Date = new Date(),
): Promise<CreatedSession> {
  const token = generateSessionToken();
  const expiresAt = new Date(now.getTime() + env.SESSION_TTL_DAYS * DAY_MS);
  await sessionRepo.insertSession({ tokenHash: hashSessionToken(token), userId, expiresAt });
  return { token, expiresAt };
}

/** Returns the session's user, or null if the token is unknown or expired (expired rows are deleted). */
export async function validateSessionToken(
  token: string,
  now: Date = new Date(),
): Promise<PublicUser | null> {
  const session = await sessionRepo.findSessionByTokenHash(hashSessionToken(token));
  if (!session) return null;

  if (session.expiresAt.getTime() <= now.getTime()) {
    await sessionRepo.deleteSessionById(session.id);
    return null;
  }
  return session.user;
}

export async function invalidateSession(token: string): Promise<void> {
  await sessionRepo.deleteSessionByTokenHash(hashSessionToken(token));
}
