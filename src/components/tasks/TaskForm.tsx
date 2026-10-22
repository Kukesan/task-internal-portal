"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { SelectField, TextareaField, TextField } from "@/components/ui/Field";
import { FormError } from "@/components/ui/FormError";
import { apiFetch } from "@/lib/client/api";
import {
  firstFieldErrors,
  formDataToObject,
  zodFieldErrors,
  type FieldErrors,
} from "@/lib/client/form";
import type { TaskDTO } from "@/lib/types";
import {
  createTaskSchema,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
} from "@/lib/validation/task";

const statusOptions = TASK_STATUSES.map((value) => ({ value, label: TASK_STATUS_LABELS[value] }));
const priorityOptions = TASK_PRIORITIES.map((value) => ({
  value,
  label: TASK_PRIORITY_LABELS[value],
}));

type TaskFormProps = { task?: TaskDTO };

/** Create when `task` is absent, edit otherwise. Both modes submit the full set of fields. */
export function TaskForm({ task }: TaskFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = createTaskSchema.safeParse(formDataToObject(event.currentTarget));
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});

    setPending(true);
    const result = task
      ? await apiFetch(`/api/tasks/${task.id}`, { method: "PATCH", body: parsed.data })
      : await apiFetch("/api/tasks", { method: "POST", body: parsed.data });

    if (!result.ok) {
      setPending(false);
      if (result.error.status === 401) {
        router.replace("/login");
        return;
      }
      setFieldErrors(firstFieldErrors(result.error.details));
      setFormError(result.error.message);
      return;
    }

    router.push("/tasks");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <FormError message={formError} />
      <TextField
        id="title"
        label="Title"
        required
        maxLength={120}
        defaultValue={task?.title}
        error={fieldErrors.title}
      />
      <TextareaField
        id="description"
        label="Description (optional)"
        rows={4}
        maxLength={2000}
        defaultValue={task?.description ?? ""}
        error={fieldErrors.description}
      />
      <div className="grid gap-5 sm:grid-cols-3">
        <SelectField
          id="status"
          label="Status"
          options={statusOptions}
          defaultValue={task?.status ?? "TODO"}
          error={fieldErrors.status}
        />
        <SelectField
          id="priority"
          label="Priority"
          options={priorityOptions}
          defaultValue={task?.priority ?? "MEDIUM"}
          error={fieldErrors.priority}
        />
        <TextField
          id="dueDate"
          label="Due date (optional)"
          type="date"
          defaultValue={task?.dueDate ?? ""}
          error={fieldErrors.dueDate}
        />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href="/tasks" className={buttonClasses("secondary")}>
          Cancel
        </Link>
        <Button type="submit" pending={pending} pendingLabel="Saving…">
          {task ? "Save changes" : "Create task"}
        </Button>
      </div>
    </form>
  );
}
