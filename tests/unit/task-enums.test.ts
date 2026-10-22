import { Priority, TaskStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/validation/task";

// The client-safe enum copies must stay in sync with the database enums.
describe("task enum mirrors", () => {
  it("match the Prisma TaskStatus enum", () => {
    expect([...TASK_STATUSES].sort()).toEqual(Object.values(TaskStatus).sort());
  });

  it("match the Prisma Priority enum", () => {
    expect([...TASK_PRIORITIES].sort()).toEqual(Object.values(Priority).sort());
  });
});
