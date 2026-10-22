import "server-only";
import type { Prisma, Priority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  createdById: true,
  assigneeId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TaskSelect;

export type TaskRecord = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;

export type TaskWriteData = {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: Date | null;
};

/**
 * Ownership scope applied to every query. In Part 1 a task belongs to its creator;
 * Part 2 widens visibility (assignee, admin) here, in one place.
 */
function ownedBy(userId: string, taskId?: string): Prisma.TaskWhereInput {
  return { createdById: userId, ...(taskId ? { id: taskId } : {}) };
}

export async function listTasksForUser(userId: string): Promise<TaskRecord[]> {
  return prisma.task.findMany({
    where: ownedBy(userId),
    select: taskSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export async function findTaskForUser(userId: string, taskId: string): Promise<TaskRecord | null> {
  return prisma.task.findFirst({ where: ownedBy(userId, taskId), select: taskSelect });
}

export async function insertTask(
  data: Required<Pick<TaskWriteData, "title">> &
    TaskWriteData & { createdById: string; assigneeId: string | null },
): Promise<TaskRecord> {
  return prisma.task.create({ data, select: taskSelect });
}

/**
 * Updates only if the task is owned by the user. The ownership check and the write are a
 * single statement, so there is no check-then-act race. Returns null when nothing matched.
 */
export async function updateTaskForUser(
  userId: string,
  taskId: string,
  data: TaskWriteData,
): Promise<TaskRecord | null> {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.task.updateMany({ where: ownedBy(userId, taskId), data });
    if (count === 0) return null;
    return tx.task.findUnique({ where: { id: taskId }, select: taskSelect });
  });
}

/** Returns false when no owned task matched. */
export async function deleteTaskForUser(userId: string, taskId: string): Promise<boolean> {
  const { count } = await prisma.task.deleteMany({ where: ownedBy(userId, taskId) });
  return count > 0;
}
