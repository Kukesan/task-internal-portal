import "server-only";
import bcrypt from "bcryptjs";

export const BCRYPT_COST = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

let dummyHash: Promise<string> | undefined;

/**
 * Runs a bcrypt comparison against a throwaway hash. Used when the email is unknown so the
 * response time doesn't reveal whether an account exists.
 */
export async function verifyAgainstDummyHash(plain: string): Promise<false> {
  dummyHash ??= hashPassword("dummy-password-for-timing-equalisation");
  await bcrypt.compare(plain, await dummyHash);
  return false;
}
