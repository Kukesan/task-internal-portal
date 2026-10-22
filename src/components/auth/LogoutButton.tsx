"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/client/api";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setPending(true);
    setError(null);
    const result = await apiFetch("/api/auth/logout", { method: "POST" });
    if (!result.ok) {
      setPending(false);
      setError("Couldn't sign out. Try again.");
      return;
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <span role="status" className="text-sm text-red-700">
        {error}
      </span>
      <Button
        variant="secondary"
        onClick={handleLogout}
        pending={pending}
        pendingLabel="Signing out…"
      >
        Sign out
      </Button>
    </div>
  );
}
