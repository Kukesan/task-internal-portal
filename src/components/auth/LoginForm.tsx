"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FormError } from "@/components/ui/FormError";
import { safeRedirectPath } from "@/lib/auth/constants";
import { apiFetch } from "@/lib/client/api";
import {
  firstFieldErrors,
  formDataToObject,
  zodFieldErrors,
  type FieldErrors,
} from "@/lib/client/form";
import { loginSchema } from "@/lib/validation/auth";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse(formDataToObject(event.currentTarget));
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});

    setPending(true);
    const result = await apiFetch("/api/auth/login", { method: "POST", body: parsed.data });
    if (!result.ok) {
      setPending(false);
      setFieldErrors(firstFieldErrors(result.error.details));
      setFormError(result.error.message);
      return;
    }

    router.replace(safeRedirectPath(next));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormError message={formError} />
      <TextField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        error={fieldErrors.email}
      />
      <TextField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        error={fieldErrors.password}
      />
      <Button type="submit" className="w-full" pending={pending} pendingLabel="Signing in…">
        Sign in
      </Button>
    </form>
  );
}
