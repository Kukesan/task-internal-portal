/**
 * Idempotent demo data: re-running resets the demo users' tasks to a known state.
 * Credentials are documented in the README; never run this against production.
 */
import { PrismaClient, type Priority, type Role, type TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedUser = { name: string; email: string; password: string; role: Role };
type SeedTask = {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueInDays?: number;
};

const users: SeedUser[] = [
  { name: "Demo User", email: "demo@portal.test", password: "Password123!", role: "USER" },
  { name: "Admin User", email: "admin@portal.test", password: "AdminPass123!", role: "ADMIN" },
];

const tasksByEmail: Record<string, SeedTask[]> = {
  "demo@portal.test": [
    {
      title: "Prepare Q3 onboarding checklist",
      description: "Collect requirements from HR and IT, then draft the checklist.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueInDays: 3,
    },
    { title: "Review expense policy draft", status: "TODO", priority: "MEDIUM", dueInDays: 7 },
    { title: "Book meeting room for retro", status: "DONE", priority: "LOW", dueInDays: -2 },
    {
      title: "Update VPN access list",
      description: "Remove leavers and add the two new contractors.",
      status: "TODO",
      priority: "HIGH",
      dueInDays: -1,
    },
  ],
  "admin@portal.test": [
    { title: "Audit admin permissions", status: "TODO", priority: "HIGH", dueInDays: 5 },
    { title: "Plan evidence review workflow", status: "IN_PROGRESS", priority: "MEDIUM" },
  ],
};

function dateInDays(days: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

async function main() {
  for (const seedUser of users) {
    const passwordHash = await bcrypt.hash(seedUser.password, 12);
    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      update: { name: seedUser.name, passwordHash, role: seedUser.role },
      create: { name: seedUser.name, email: seedUser.email, passwordHash, role: seedUser.role },
    });

    await prisma.task.deleteMany({ where: { createdById: user.id } });
    await prisma.task.createMany({
      data: (tasksByEmail[seedUser.email] ?? []).map((task) => ({
        title: task.title,
        description: task.description ?? null,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueInDays === undefined ? null : dateInDays(task.dueInDays),
        createdById: user.id,
        assigneeId: user.id,
      })),
    });
    console.log(`Seeded ${seedUser.role.toLowerCase()} ${seedUser.email}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
