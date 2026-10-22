import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "@/lib/validation/auth";
import {
  createTaskSchema,
  taskIdSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "@/lib/validation/task";

const validSignup = {
  name: "Ada Lovelace",
  email: "Ada@Example.com ",
  password: "password123",
  confirmPassword: "password123",
};

describe("signupSchema", () => {
  it("normalises email to trimmed lowercase", () => {
    expect(signupSchema.parse(validSignup).email).toBe("ada@example.com");
  });

  it("requires matching passwords and reports the error on confirmPassword", () => {
    const result = signupSchema.safeParse({ ...validSignup, confirmPassword: "different" });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.confirmPassword).toEqual(["Passwords do not match"]);
  });

  it.each([
    ["short password", { password: "short", confirmPassword: "short" }, "password"],
    ["invalid email", { email: "not-an-email" }, "email"],
    ["blank name", { name: "   " }, "name"],
    [
      "password over 72 bytes",
      { password: "é".repeat(40), confirmPassword: "é".repeat(40) },
      "password",
    ],
  ])("rejects %s", (_label, override, field) => {
    const result = signupSchema.safeParse({ ...validSignup, ...override });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors).toHaveProperty(field);
  });
});

describe("loginSchema", () => {
  it("requires email and password", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
    expect(Object.keys(result.error?.flatten().fieldErrors ?? {})).toEqual(["email", "password"]);
  });
});

describe("createTaskSchema", () => {
  it("applies defaults and converts empty form values to null", () => {
    expect(
      createTaskSchema.parse({ title: "  Write tests  ", description: "", dueDate: "" }),
    ).toEqual({
      title: "Write tests",
      description: null,
      status: "TODO",
      priority: "MEDIUM",
      dueDate: null,
    });
  });

  it("enforces title length 1–120", () => {
    expect(createTaskSchema.safeParse({ title: "" }).success).toBe(false);
    expect(createTaskSchema.safeParse({ title: "x".repeat(120) }).success).toBe(true);
    expect(createTaskSchema.safeParse({ title: "x".repeat(121) }).success).toBe(false);
  });

  it("limits description to 2000 characters", () => {
    expect(createTaskSchema.safeParse({ title: "t", description: "x".repeat(2001) }).success).toBe(
      false,
    );
  });

  it.each(["2026-02-30", "2026-13-01", "01/02/2026", "tomorrow"])(
    "rejects due date %s",
    (dueDate) => {
      expect(createTaskSchema.safeParse({ title: "t", dueDate }).success).toBe(false);
    },
  );

  it("accepts a real calendar date", () => {
    expect(createTaskSchema.parse({ title: "t", dueDate: "2028-02-29" }).dueDate).toBe(
      "2028-02-29",
    );
  });

  it("rejects unknown enum values", () => {
    expect(createTaskSchema.safeParse({ title: "t", status: "BLOCKED" }).success).toBe(false);
    expect(createTaskSchema.safeParse({ title: "t", priority: "URGENT" }).success).toBe(false);
  });

  it("does not let clients set ownership fields", () => {
    const parsed = createTaskSchema.parse({ title: "t", createdById: "someone-else" });
    expect(parsed).not.toHaveProperty("createdById");
  });
});

describe("updateTaskSchema", () => {
  it("accepts a partial update", () => {
    expect(updateTaskSchema.parse({ priority: "HIGH" })).toEqual({ priority: "HIGH" });
  });

  it("rejects an empty update and unknown fields", () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(false);
    expect(updateTaskSchema.safeParse({ assigneeId: "x" }).success).toBe(false);
  });
});

describe("updateTaskStatusSchema", () => {
  it("only accepts a valid status", () => {
    expect(updateTaskStatusSchema.parse({ status: "DONE" })).toEqual({ status: "DONE" });
    expect(updateTaskStatusSchema.safeParse({ status: "done" }).success).toBe(false);
  });
});

describe("taskIdSchema", () => {
  it("rejects ids that aren't cuid-shaped", () => {
    expect(taskIdSchema.safeParse("clx1abc2def3").success).toBe(true);
    expect(taskIdSchema.safeParse("../etc/passwd").success).toBe(false);
    expect(taskIdSchema.safeParse("").success).toBe(false);
  });
});
