import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DEFAULT_AUTHENTICATED_PATH } from "@/lib/auth/constants";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  // Middleware only checks the cookie exists; confirm against the DB before redirecting away.
  if (await getCurrentUser()) redirect(DEFAULT_AUTHENTICATED_PATH);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-sm font-semibold tracking-wide text-indigo-600 uppercase">
          Internal Portal
        </p>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
