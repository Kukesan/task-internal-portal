import { execSync } from "node:child_process";

/** Resets the test database to the committed migrations once per test run. */
export default function setup(): void {
  const testUrl = process.env.DATABASE_URL_TEST;
  if (!testUrl) throw new Error("DATABASE_URL_TEST is not set.");

  // Guard against wiping the development database by accident.
  const dbName = new URL(testUrl).pathname.slice(1);
  if (testUrl === process.env.DATABASE_URL || !dbName.includes("test")) {
    throw new Error(
      `Refusing to reset "${dbName}": DATABASE_URL_TEST must point at a *test* database.`,
    );
  }

  execSync("npx prisma migrate reset --force --skip-seed --skip-generate", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testUrl },
  });
}
