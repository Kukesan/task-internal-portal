import "server-only";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string({ required_error: "DATABASE_URL is required" })
    .url()
    .refine((url) => url.startsWith("postgres"), "DATABASE_URL must be a Postgres URL"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid environment variables:\n${issues.join("\n")}`);
  }
  return parsed.data;
}

/** Validated once at module load so a misconfigured server fails fast. */
export const env = loadEnv();
