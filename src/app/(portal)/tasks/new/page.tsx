import type { Metadata } from "next";
import { TaskForm } from "@/components/tasks/TaskForm";

export const metadata: Metadata = { title: "New task" };

export default function NewTaskPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">New task</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <TaskForm />
      </div>
    </div>
  );
}
