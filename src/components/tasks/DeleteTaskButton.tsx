"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { apiFetch } from "@/lib/client/api";

export function DeleteTaskButton({ taskId, taskTitle }: { taskId: string; taskTitle: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    const result = await apiFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    setPending(false);

    // A 404 means it's already gone (e.g. deleted in another tab), which is what the user wanted.
    if (!result.ok && result.error.status !== 404) {
      setError(result.error.message);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="dangerGhost" onClick={() => setOpen(true)}>
        Delete<span className="sr-only"> task “{taskTitle}”</span>
      </Button>
      <ConfirmDialog
        open={open}
        title="Delete this task?"
        description={`“${taskTitle}” will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete task"
        pending={pending}
        error={error}
        onConfirm={handleConfirm}
        onCancel={() => {
          setOpen(false);
          setError(null);
        }}
      />
    </>
  );
}
