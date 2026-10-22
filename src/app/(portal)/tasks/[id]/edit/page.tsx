import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/tasks/TaskForm";
import { requirePageUser } from "@/lib/auth/requireUser";
import { NotFoundError } from "@/lib/errors";
import type { TaskDTO } from "@/lib/types";
import * as taskService from "@/server/services/task.service";

export const metadata: Metadata = { title: "Edit task" };

async function loadOwnTask(userId: string, rawId: string): Promise<TaskDTO> {
  try {
    return await taskService.getTask(userId, taskService.parseTaskId(rawId));
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const task = await loadOwnTask(user.id, (await params).id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit task</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <TaskForm task={task} />
      </div>
    </div>
  );
}
