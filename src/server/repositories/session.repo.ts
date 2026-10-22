import "server-only";
import { prisma } from "@/lib/db";
import type { PublicUser } from "@/lib/types";
import { publicUserSelect } from "@/server/repositories/user.repo";

export type SessionWithUser = {
  id: string;
  expiresAt: Date;
  user: PublicUser;
};

export async function insertSession(data: {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
}): Promise<void> {
  await prisma.session.create({ data, select: { id: true } });
}

export async function findSessionByTokenHash(tokenHash: string): Promise<SessionWithUser | null> {
  return prisma.session.findUnique({
    where: { tokenHash },
    select: { id: true, expiresAt: true, user: { select: publicUserSelect } },
  });
}

export async function deleteSessionById(id: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id } });
}

export async function deleteSessionByTokenHash(tokenHash: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash } });
}

export async function deleteExpiredSessions(now: Date = new Date()): Promise<number> {
  const { count } = await prisma.session.deleteMany({ where: { expiresAt: { lte: now } } });
  return count;
}

export async function deleteExpiredSessionsForUser(
  userId: string,
  now: Date = new Date(),
): Promise<void> {
  await prisma.session.deleteMany({ where: { userId, expiresAt: { lte: now } } });
}
