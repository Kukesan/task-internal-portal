import { z } from "zod";

// Mirrors the Prisma enums; kept here so client bundles don't import @prisma/client.
// tests/unit/task-enums.test.ts guards against drift.
export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealCalendarDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Empty strings from form inputs mean "no value". */
const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

const dueDateSchema = z.preprocess(
  emptyToNull,
  z
    .string()
    .regex(ISO_DATE, "Use the format YYYY-MM-DD")
    .refine(isRealCalendarDate, "Enter a valid date")
    .nullable(),
);

const descriptionSchema = z.preprocess(
  emptyToNull,
  z.string().trim().max(2000, "Description must be 2000 characters or fewer").nullable(),
);

export const taskStatusSchema = z.enum(TASK_STATUSES, {
  errorMap: () => ({ message: "Choose a valid status" }),
});
export const taskPrioritySchema = z.enum(TASK_PRIORITIES, {
  errorMap: () => ({ message: "Choose a valid priority" }),
});

const taskFields = {
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(120, "Title must be 120 characters or fewer"),
  description: descriptionSchema,
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: dueDateSchema,
};

export const createTaskSchema = z.object({
  title: taskFields.title,
  description: taskFields.description.optional().default(null),
  status: taskFields.status.optional().default("TODO"),
  priority: taskFields.priority.optional().default("MEDIUM"),
  dueDate: taskFields.dueDate.optional().default(null),
});

export const updateTaskSchema = z
  .object(taskFields)
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, "Provide at least one field to update");

export const updateTaskStatusSchema = z.object({ status: taskStatusSchema }).strict();

/** Route param ids are cuids; reject anything else before it reaches the database. */
export const taskIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+$/i);

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type TaskFormValues = z.input<typeof createTaskSchema>;
