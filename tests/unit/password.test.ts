import { describe, expect, it } from "vitest";
import {
  BCRYPT_COST,
  hashPassword,
  verifyAgainstDummyHash,
  verifyPassword,
} from "@/lib/auth/password";

describe("password hashing", () => {
  it("produces a salted bcrypt hash at the configured cost", async () => {
    const hash = await hashPassword("correct horse battery staple");

    expect(hash).not.toContain("correct horse");
    expect(hash).toMatch(new RegExp(`^\\$2[aby]\\$${BCRYPT_COST}\\$`));
    expect(await hashPassword("correct horse battery staple")).not.toBe(hash);
  });

  it("verifies the right password and rejects a wrong one", async () => {
    const hash = await hashPassword("s3cret-password");

    expect(await verifyPassword("s3cret-password", hash)).toBe(true);
    expect(await verifyPassword("S3cret-password", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("dummy verification always fails", async () => {
    expect(await verifyAgainstDummyHash("anything")).toBe(false);
  });
});
