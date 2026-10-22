import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { validateSessionToken } from "@/lib/auth/session";
import { ConflictError, InvalidCredentialsError } from "@/lib/errors";
import { signupSchema } from "@/lib/validation/auth";
import * as authService from "@/server/services/auth.service";
import { prisma, resetDatabase } from "../helpers/db";

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const signupInput = signupSchema.parse({
  name: "Grace Hopper",
  email: "grace@example.test",
  password: "compilers-rock",
  confirmPassword: "compilers-rock",
});

describe("auth.service", () => {
  it("signs up a user, hashes the password and opens a session", async () => {
    const { user, session } = await authService.signup(signupInput);

    expect(user).toEqual({
      id: expect.any(String),
      name: "Grace Hopper",
      email: "grace@example.test",
      role: "USER",
    });
    const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row.passwordHash).not.toBe(signupInput.password);
    expect(await validateSessionToken(session.token)).toEqual(user);
  });

  it("rejects a duplicate email regardless of case", async () => {
    await authService.signup(signupInput);
    await expect(
      authService.signup({ ...signupInput, email: "GRACE@example.test" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("logs in with the right password", async () => {
    await authService.signup(signupInput);
    const { user } = await authService.login({
      email: "grace@example.test",
      password: "compilers-rock",
    });
    expect(user.email).toBe("grace@example.test");
  });

  it("gives the same error for a wrong password and an unknown email", async () => {
    await authService.signup(signupInput);

    const wrongPassword = authService.login({ email: "grace@example.test", password: "nope" });
    const unknownEmail = authService.login({ email: "nobody@example.test", password: "nope" });

    await expect(wrongPassword).rejects.toBeInstanceOf(InvalidCredentialsError);
    await expect(unknownEmail).rejects.toBeInstanceOf(InvalidCredentialsError);
    await expect(wrongPassword).rejects.toThrow("Invalid email or password.");
  });

  it("logout revokes the session", async () => {
    const { session } = await authService.signup(signupInput);
    await authService.logout(session.token);
    expect(await validateSessionToken(session.token)).toBeNull();
  });
});
