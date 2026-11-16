import { NextResponse } from "next/server";
import { setSessionCookie } from "@/server/auth/cookies";
import { clientIp, parseJson, route } from "@/server/http";
import { signupLimiter } from "@/server/security/rate-limit";
import { signupSchema } from "@/lib/validation/auth";
import * as authService from "@/server/services/auth.service";

export const POST = route(async (req) => {
  signupLimiter.consume(`signup:${clientIp(req)}`);
  const input = await parseJson(req, signupSchema);

  const { user, session } = await authService.signup(input);
  await setSessionCookie(session.token, session.expiresAt);

  return NextResponse.json({ user }, { status: 201 });
});
