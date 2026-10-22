import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  createSession,
  hashSessionToken,
  invalidateSession,
  validateSessionToken,
} from "@/lib/auth/session";
import { createTestUser, prisma, resetDatabase } from "../helpers/db";

const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe("sessions", () => {
  it("creates a session whose stored value is the hash, not the raw token", async () => {
    const user = await createTestUser();
    const { token, expiresAt } = await createSession(user.id);

    expect(Buffer.from(token, "base64url")).toHaveLength(32);
    const row = await prisma.session.findFirstOrThrow({ where: { userId: user.id } });
    expect(row.tokenHash).toBe(hashSessionToken(token));
    expect(row.tokenHash).not.toBe(token);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now() + 6 * DAY_MS);
  });

  it("validates a live token and returns only public user fields", async () => {
    const user = await createTestUser();
    const { token } = await createSession(user.id);

    const sessionUser = await validateSessionToken(token);
    expect(sessionUser).toEqual(user);
    expect(sessionUser).not.toHaveProperty("passwordHash");
  });

  it("rejects unknown and tampered tokens", async () => {
    const user = await createTestUser();
    const { token } = await createSession(user.id);

    expect(await validateSessionToken("not-a-real-token")).toBeNull();
    expect(await validateSessionToken(`${token.slice(0, -1)}x`)).toBeNull();
  });

  it("treats an expired session as invalid and deletes it", async () => {
    const user = await createTestUser();
    const createdAt = new Date("2026-01-01T00:00:00Z");
    const { token, expiresAt } = await createSession(user.id, createdAt);

    expect(await validateSessionToken(token, new Date(expiresAt.getTime() - 1))).toEqual(user);
    expect(await validateSessionToken(token, expiresAt)).toBeNull();
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
  });

  it("revokes a session on logout without affecting other sessions", async () => {
    const user = await createTestUser();
    const first = await createSession(user.id);
    const second = await createSession(user.id);

    await invalidateSession(first.token);

    expect(await validateSessionToken(first.token)).toBeNull();
    expect(await validateSessionToken(second.token)).toEqual(user);
  });

  it("cascades session deletion when the user is deleted", async () => {
    const user = await createTestUser();
    await createSession(user.id);

    await prisma.user.delete({ where: { id: user.id } });

    expect(await prisma.session.count()).toBe(0);
  });
});
