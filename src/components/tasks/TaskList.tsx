import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import type { TaskDTO } from "@/lib/types";
import { TASK_PRIORITY_LABELS, type TaskPriority } from "@/lib/validation/task";
import { DeleteTaskButton } from "./DeleteTaskButton";
import { StatusSelect } from "./StatusSelect";

const priorityStyles: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-amber-100 text-amber-800",
  HIGH: "bg-red-100 text-red-800",
};

const dueDateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });

function formatDueDate(dueDate: string): string {
  return dueDateFormat.format(new Date(`${dueDate}T00:00:00Z`));
}

function isOverdue(task: TaskDTO, today: string): boolean {
  return task.dueDate !== null && task.status !== "DONE" && task.dueDate < today;
}

/** Server component: renders the list; only the status select and delete button hydrate. */
export function TaskList({ tasks }: { tasks: TaskDTO[] }) {
  if (tasks.length === 0) return <EmptyState />;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <ul className="space-y-3" aria-label="Tasks">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <h2
              className={`font-medium break-words ${task.status === "DONE" ? "text-slate-500 line-through" : "text-slate-900"}`}
            >
              {task.title}
            </h2>
            {task.description && (
              <p className="line-clamp-2 text-sm break-words text-slate-600">{task.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full px-2 py-0.5 font-medium ${priorityStyles[task.priority]}`}
              >
                {TASK_PRIORITY_LABELS[task.priority]} priority
              </span>
              {task.dueDate && (
                <span
                  className={isOverdue(task, today) ? "font-medium text-red-700" : "text-slate-500"}
                >
                  Due {formatDueDate(task.dueDate)}
                  {isOverdue(task, today) && " · overdue"}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <StatusSelect taskId={task.id} taskTitle={task.title} status={task.status} />
            <Link href={`/tasks/${task.id}/edit`} className={buttonClasses("ghost")}>
              Edit<span className="sr-only"> task “{task.title}”</span>
            </Link>
            <DeleteTaskButton taskId={task.id} taskTitle={task.title} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <h2 className="text-base font-semibold text-slate-900">No tasks yet</h2>
      <p className="mt-1 text-sm text-slate-600">Create your first task to start tracking work.</p>
      <Link href="/tasks/new" className={buttonClasses("primary", "mt-4")}>
        New task
      </Link>
    </div>
  );
}
