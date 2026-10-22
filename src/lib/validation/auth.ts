import { z } from "zod";

// bcrypt only uses the first 72 bytes of a password; reject longer input instead of truncating silently.
const MAX_PASSWORD_BYTES = 72;
const byteLength = (value: string) => new TextEncoder().encode(value).length;

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .email("Enter a valid email address")
  .transform((email) => email.toLowerCase());

export const signupSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine((p) => byteLength(p) <= MAX_PASSWORD_BYTES, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Password is required")
    .refine((p) => byteLength(p) <= MAX_PASSWORD_BYTES, "Password is too long"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
