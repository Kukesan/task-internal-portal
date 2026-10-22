import "server-only";
import { hashPassword, verifyAgainstDummyHash, verifyPassword } from "@/lib/auth/password";
import { createSession, invalidateSession, type CreatedSession } from "@/lib/auth/session";
import { ConflictError, InvalidCredentialsError } from "@/lib/errors";
import type { PublicUser } from "@/lib/types";
import type { LoginInput, SignupInput } from "@/lib/validation/auth";
import { deleteExpiredSessionsForUser } from "@/server/repositories/session.repo";
import * as userRepo from "@/server/repositories/user.repo";

export type AuthResult = { user: PublicUser; session: CreatedSession };

export async function signup(input: SignupInput): Promise<AuthResult> {
  const passwordHash = await hashPassword(input.password);
  const user = await userRepo.createUser({ name: input.name, email: input.email, passwordHash });
  if (!user) {
    throw new ConflictError("An account with this email already exists.", {
      email: ["An account with this email already exists."],
    });
  }
  return { user, session: await createSession(user.id) };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const credentials = await userRepo.findUserCredentialsByEmail(input.email);

  const passwordMatches = credentials
    ? await verifyPassword(input.password, credentials.passwordHash)
    : await verifyAgainstDummyHash(input.password);

  // Same error for unknown email and wrong password: no account enumeration.
  if (!credentials || !passwordMatches) throw new InvalidCredentialsError();

  const user = await userRepo.findPublicUserById(credentials.id);
  if (!user) throw new InvalidCredentialsError();

  await deleteExpiredSessionsForUser(user.id);
  return { user, session: await createSession(user.id) };
}

export async function logout(token: string | null): Promise<void> {
  if (token) await invalidateSession(token);
}
