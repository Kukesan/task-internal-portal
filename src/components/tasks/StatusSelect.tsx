"use client";

import { useRouter } from "next/navigation";
import { useId, useOptimistic, useState, useTransition } from "react";
import { apiFetch } from "@/lib/client/api";
import { TASK_STATUSES, TASK_STATUS_LABELS, type TaskStatus } from "@/lib/validation/task";

/**
 * Inline status change with an optimistic update. While the request is in flight the select
 * shows the new value; if it fails, the transition ends without a refresh and React drops the
 * optimistic value, rolling back to the server's status automatically.
 */
export function StatusSelect({
  taskId,
  taskTitle,
  status,
}: {
  taskId: string;
  taskTitle: string;
  status: TaskStatus;
}) {
  const router = useRouter();
  const id = useId();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: TaskStatus) {
    setError(null);
    startTransition(async () => {
      setOptimisticStatus(next);
      const result = await apiFetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        body: { status: next },
      });
      if (!result.ok) {
        setError(`Couldn't update status: ${result.error.message}`);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="sr-only">
        Status for “{taskTitle}”
      </label>
      <select
        id={id}
        value={optimisticStatus}
        onChange={(event) => handleChange(event.target.value as TaskStatus)}
        aria-busy={isPending || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
      >
        {TASK_STATUSES.map((value) => (
          <option key={value} value={value}>
            {TASK_STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      <p id={`${id}-error`} role="alert" className="text-xs text-red-700">
        {error}
      </p>
    </div>
  );
}
