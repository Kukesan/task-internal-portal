import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/requireUser";
import { route } from "@/server/http";

export const GET = route(async () => {
  const user = await requireUser();
  return NextResponse.json({ user });
});
