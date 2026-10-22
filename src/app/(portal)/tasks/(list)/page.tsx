import type { Metadata } from "next";
import Link from "next/link";
import { TaskList } from "@/components/tasks/TaskList";
import { buttonClasses } from "@/components/ui/Button";
import { requirePageUser } from "@/lib/auth/requireUser";
import * as taskService from "@/server/services/task.service";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage() {
  // Checked here as well as in the layout: layouts and pages render independently.
  const user = await requirePageUser();
  const tasks = await taskService.listTasks(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-slate-600">
            {tasks.length === 1 ? "1 task" : `${tasks.length} tasks`}
          </p>
        </div>
        <Link href="/tasks/new" className={buttonClasses("primary")}>
          New task
        </Link>
      </div>
      <TaskList tasks={tasks} />
    </div>
  );
}
