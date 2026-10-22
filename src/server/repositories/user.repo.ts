import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { PublicUser } from "@/lib/types";

/** The only user fields that may leave the server. Never includes passwordHash. */
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} satisfies Prisma.UserSelect;

export async function findUserCredentialsByEmail(
  email: string,
): Promise<{ id: string; passwordHash: string } | null> {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });
}

export async function findPublicUserById(id: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
}

/** Returns null when the email is already registered (unique violation). */
export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<PublicUser | null> {
  try {
    return await prisma.user.create({ data, select: publicUserSelect });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return null;
    }
    throw error;
  }
}
