import "server-only";
import { NotFoundError } from "@/lib/errors";
import type { TaskDTO } from "@/lib/types";
import {
  taskIdSchema,
  type CreateTaskInput,
  type TaskStatus,
  type UpdateTaskInput,
} from "@/lib/validation/task";
import * as taskRepo from "@/server/repositories/task.repo";
import type { TaskRecord, TaskWriteData } from "@/server/repositories/task.repo";

// Tasks owned by someone else are reported as "not found" (404, not 403) so ids can't be probed.
const taskNotFound = () => new NotFoundError("Task not found.");

/** Malformed ids can't match any task, so they get the same 404 as a missing one. */
export function parseTaskId(raw: string): string {
  const parsed = taskIdSchema.safeParse(raw);
  if (!parsed.success) throw taskNotFound();
  return parsed.data;
}

function toDateOnly(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00Z`) : null;
}

export function toTaskDTO(task: TaskRecord): TaskDTO {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
    createdById: task.createdById,
    assigneeId: task.assigneeId,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export async function listTasks(userId: string): Promise<TaskDTO[]> {
  const tasks = await taskRepo.listTasksForUser(userId);
  return tasks.map(toTaskDTO);
}

export async function getTask(userId: string, taskId: string): Promise<TaskDTO> {
  const task = await taskRepo.findTaskForUser(userId, taskId);
  if (!task) throw taskNotFound();
  return toTaskDTO(task);
}

export async function createTask(userId: string, input: CreateTaskInput): Promise<TaskDTO> {
  const task = await taskRepo.insertTask({
    title: input.title,
    description: input.description,
    status: input.status,
    priority: input.priority,
    dueDate: toDateOnly(input.dueDate),
    createdById: userId,
    // Part 1: tasks are self-assigned. Part 2 introduces choosing an assignee.
    assigneeId: userId,
  });
  return toTaskDTO(task);
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<TaskDTO> {
  const data: TaskWriteData = {
    title: input.title,
    description: input.description,
    status: input.status,
    priority: input.priority,
    dueDate: input.dueDate === undefined ? undefined : toDateOnly(input.dueDate),
  };
  const task = await taskRepo.updateTaskForUser(userId, taskId, data);
  if (!task) throw taskNotFound();
  return toTaskDTO(task);
}

export async function updateTaskStatus(
  userId: string,
  taskId: string,
  status: TaskStatus,
): Promise<TaskDTO> {
  const task = await taskRepo.updateTaskForUser(userId, taskId, { status });
  if (!task) throw taskNotFound();
  return toTaskDTO(task);
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const deleted = await taskRepo.deleteTaskForUser(userId, taskId);
  if (!deleted) throw taskNotFound();
}
