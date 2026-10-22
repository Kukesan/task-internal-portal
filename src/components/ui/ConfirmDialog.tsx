"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Built on the native <dialog> element: showModal() gives us a focus trap, Escape-to-close,
 * an inert background and focus restoration for free.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onCancel();
      }}
      className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-lg p-0 shadow-xl backdrop:bg-slate-900/40"
    >
      <div className="space-y-4 p-6">
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        <p id={descriptionId} className="text-sm text-slate-600">
          {description}
        </p>
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
        <div className="flex justify-end gap-2">
          {/* Cancel is the first focusable element, so showModal() focuses it: the safe default. */}
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} pending={pending} pendingLabel="Deleting…">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
