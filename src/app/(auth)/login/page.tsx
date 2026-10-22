import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

type SearchParams = Promise<{ next?: string | string[]; expired?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { next, expired } = await searchParams;

  return (
    <>
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="mt-1 mb-6 text-sm text-slate-600">
        Welcome back. Enter your details to continue.
      </p>
      {expired && (
        <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
          Your session has ended. Please sign in again.
        </p>
      )}
      <LoginForm next={typeof next === "string" ? next : undefined} />
      <p className="mt-6 text-center text-sm text-slate-600">
        No account?{" "}
        <Link href="/signup" className="font-medium text-indigo-700 hover:underline">
          Create one
        </Link>
      </p>
    </>
  );
}
