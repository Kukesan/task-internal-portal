import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { parseJson, route } from "@/lib/http";
import { updateTaskStatusSchema } from "@/lib/validation/task";
import * as taskService from "@/server/services/task.service";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser();
  const taskId = taskService.parseTaskId((await params).id);
  const { status } = await parseJson(req, updateTaskStatusSchema);
  const task = await taskService.updateTaskStatus(user.id, taskId, status);
  return NextResponse.json({ task });
});
