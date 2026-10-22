import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

loadDotenv({ quiet: true });

const testDatabaseUrl = process.env.DATABASE_URL_TEST;
if (!testDatabaseUrl) {
  throw new Error("DATABASE_URL_TEST must be set to run tests (see .env.example).");
}

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // `server-only` throws outside the React Server bundle; it's a build-time guard only.
      "server-only": fileURLToPath(new URL("./tests/setup/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // App code under test only ever sees the isolated test database.
    env: { DATABASE_URL: testDatabaseUrl, NODE_ENV: "test" },
    testTimeout: 20_000,
    hookTimeout: 60_000,
    // Integration files share one database, so files run sequentially (unit tests are fast anyway).
    fileParallelism: false,
    projects: [
      {
        extends: true,
        test: { name: "unit", include: ["tests/unit/**/*.test.ts"] },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          // Resets the test database (prisma migrate reset) once per run.
          globalSetup: ["tests/setup/global-setup.ts"],
        },
      },
    ],
  },
});
