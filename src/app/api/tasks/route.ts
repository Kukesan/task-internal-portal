import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { parseJson, route } from "@/lib/http";
import { createTaskSchema } from "@/lib/validation/task";
import * as taskService from "@/server/services/task.service";

export const GET = route(async () => {
  const user = await requireUser();
  const tasks = await taskService.listTasks(user.id);
  return NextResponse.json({ tasks });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const input = await parseJson(req, createTaskSchema);
  const task = await taskService.createTask(user.id, input);
  return NextResponse.json({ task }, { status: 201 });
});
