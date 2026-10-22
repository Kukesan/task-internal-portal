import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { NotFoundError } from "@/lib/errors";
import type { PublicUser } from "@/lib/types";
import { createTaskSchema } from "@/lib/validation/task";
import * as taskService from "@/server/services/task.service";
import { createTestUser, prisma, resetDatabase } from "../helpers/db";

let alice: PublicUser;
let bob: PublicUser;

beforeEach(async () => {
  await resetDatabase();
  alice = await createTestUser({ name: "Alice" });
  bob = await createTestUser({ name: "Bob" });
});
afterAll(() => prisma.$disconnect());

const newTask = (title = "Ship Part 1") =>
  createTaskSchema.parse({ title, priority: "HIGH", dueDate: "2026-12-31" });

describe("task.service — happy path", () => {
  it("creates a task owned by and assigned to the creator", async () => {
    const task = await taskService.createTask(alice.id, newTask());

    expect(task).toMatchObject({
      title: "Ship Part 1",
      status: "TODO",
      priority: "HIGH",
      dueDate: "2026-12-31",
      createdById: alice.id,
      assigneeId: alice.id,
    });
  });

  it("lists only the user's own tasks, newest first", async () => {
    const first = await taskService.createTask(alice.id, newTask("first"));
    const second = await taskService.createTask(alice.id, newTask("second"));
    await taskService.createTask(bob.id, newTask("bob's"));

    const tasks = await taskService.listTasks(alice.id);
    expect(tasks.map((t) => t.id)).toEqual([second.id, first.id]);
  });

  it("updates fields, changes status and deletes", async () => {
    const task = await taskService.createTask(alice.id, newTask());

    const updated = await taskService.updateTask(alice.id, task.id, {
      title: "Renamed",
      dueDate: null,
    });
    expect(updated).toMatchObject({ title: "Renamed", dueDate: null, priority: "HIGH" });

    const done = await taskService.updateTaskStatus(alice.id, task.id, "DONE");
    expect(done.status).toBe("DONE");

    await taskService.deleteTask(alice.id, task.id);
    await expect(taskService.getTask(alice.id, task.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("task.service — ownership (no IDOR)", () => {
  it("another user cannot read, update, change status or delete the task", async () => {
    const task = await taskService.createTask(alice.id, newTask());

    await expect(taskService.getTask(bob.id, task.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      taskService.updateTask(bob.id, task.id, { title: "pwned" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(taskService.updateTaskStatus(bob.id, task.id, "DONE")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(taskService.deleteTask(bob.id, task.id)).rejects.toBeInstanceOf(NotFoundError);

    // Alice's task is untouched.
    expect(await taskService.getTask(alice.id, task.id)).toEqual(task);
  });

  it("reports a foreign task exactly like a missing one", async () => {
    const task = await taskService.createTask(alice.id, newTask());

    const foreign = await taskService.getTask(bob.id, task.id).catch((e: unknown) => e);
    const missing = await taskService.getTask(bob.id, "doesnotexist").catch((e: unknown) => e);

    expect(foreign).toEqual(missing);
    expect((foreign as NotFoundError).status).toBe(404);
  });

  it("rejects malformed ids as not found", () => {
    expect(() => taskService.parseTaskId("1; DROP TABLE tasks")).toThrow(NotFoundError);
  });
});

describe("data integrity", () => {
  it("restricts deleting a user who still owns tasks", async () => {
    await taskService.createTask(alice.id, newTask());
    await expect(prisma.user.delete({ where: { id: alice.id } })).rejects.toThrow();
  });
});
