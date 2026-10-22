"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FormError } from "@/components/ui/FormError";
import { DEFAULT_AUTHENTICATED_PATH } from "@/lib/auth/constants";
import { apiFetch } from "@/lib/client/api";
import {
  firstFieldErrors,
  formDataToObject,
  zodFieldErrors,
  type FieldErrors,
} from "@/lib/client/form";
import { signupSchema } from "@/lib/validation/auth";

export function SignupForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = signupSchema.safeParse(formDataToObject(event.currentTarget));
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});

    setPending(true);
    const result = await apiFetch("/api/auth/signup", { method: "POST", body: parsed.data });
    if (!result.ok) {
      setPending(false);
      setFieldErrors(firstFieldErrors(result.error.details));
      setFormError(result.error.message);
      return;
    }

    router.replace(DEFAULT_AUTHENTICATED_PATH);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormError message={formError} />
      <TextField id="name" label="Name" autoComplete="name" required error={fieldErrors.name} />
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
        autoComplete="new-password"
        required
        hint="At least 8 characters."
        error={fieldErrors.password}
      />
      <TextField
        id="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        required
        error={fieldErrors.confirmPassword}
      />
      <Button type="submit" className="w-full" pending={pending} pendingLabel="Creating account…">
        Create account
      </Button>
    </form>
  );
}
