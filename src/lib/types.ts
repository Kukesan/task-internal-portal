import type { TaskPriority, TaskStatus } from "@/lib/validation/task";

/** Shapes that cross the server → client boundary (API JSON and RSC props). */

export type Role = "USER" | "ADMIN";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type TaskDTO = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  /** Calendar date as YYYY-MM-DD. */
  dueDate: string | null;
  createdById: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
};
