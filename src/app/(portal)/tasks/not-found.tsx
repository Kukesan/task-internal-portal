import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

export default function TaskNotFound() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-lg font-semibold">Task not found</h1>
      <p className="mt-1 text-sm text-slate-600">
        It may have been deleted, or you don&apos;t have access to it.
      </p>
      <Link href="/tasks" className={buttonClasses("secondary", "mt-4")}>
        Back to tasks
      </Link>
    </div>
  );
}
