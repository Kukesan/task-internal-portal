import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/cookies";
import { clientIp, parseJson, route } from "@/lib/http";
import { loginLimiter } from "@/lib/security/rate-limit";
import { loginSchema } from "@/lib/validation/auth";
import * as authService from "@/server/services/auth.service";

export const POST = route(async (req) => {
  loginLimiter.byIp.consume(`login:ip:${clientIp(req)}`);
  const input = await parseJson(req, loginSchema);

  const emailKey = `login:email:${input.email}`;
  loginLimiter.byEmail.consume(emailKey);

  const { user, session } = await authService.login(input);
  loginLimiter.byEmail.reset(emailKey);
  await setSessionCookie(session.token, session.expiresAt);

  return NextResponse.json({ user });
});
