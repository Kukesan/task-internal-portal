"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="font-semibold text-red-900">Something went wrong loading your tasks.</h2>
      <p className="mt-1 text-sm text-red-800">
        Please try again. If the problem continues, contact support
        {error.digest ? ` and quote reference ${error.digest}` : ""}.
      </p>
      <Button variant="secondary" className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
