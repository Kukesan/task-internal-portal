import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { PublicUser } from "@/lib/types";

export { prisma };

export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "tasks", "sessions", "users" CASCADE');
}

let counter = 0;

/** Inserts a user directly (low bcrypt cost keeps tests fast). */
export async function createTestUser(
  overrides: Partial<{ name: string; email: string; password: string }> = {},
): Promise<PublicUser> {
  counter += 1;
  const password = overrides.password ?? "Password123!";
  return prisma.user.create({
    data: {
      name: overrides.name ?? `Test User ${counter}`,
      email: overrides.email ?? `user${counter}-${Date.now()}@example.test`,
      passwordHash: await bcrypt.hash(password, 4),
    },
    select: { id: true, name: true, email: true, role: true },
  });
}
