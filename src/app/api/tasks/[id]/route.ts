import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { parseJson, route } from "@/lib/http";
import { updateTaskSchema } from "@/lib/validation/task";
import * as taskService from "@/server/services/task.service";

type Params = { id: string };

export const GET = route<Params>(async (_req, { params }) => {
  const user = await requireUser();
  const taskId = taskService.parseTaskId((await params).id);
  const task = await taskService.getTask(user.id, taskId);
  return NextResponse.json({ task });
});

export const PATCH = route<Params>(async (req, { params }) => {
  const user = await requireUser();
  const taskId = taskService.parseTaskId((await params).id);
  const input = await parseJson(req, updateTaskSchema);
  const task = await taskService.updateTask(user.id, taskId, input);
  return NextResponse.json({ task });
});

export const DELETE = route<Params>(async (_req, { params }) => {
  const user = await requireUser();
  const taskId = taskService.parseTaskId((await params).id);
  await taskService.deleteTask(user.id, taskId);
  return new Response(null, { status: 204 });
});
