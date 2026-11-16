import { clearSessionCookie, readSessionCookie } from "@/server/auth/cookies";
import { route } from "@/server/http";
import * as authService from "@/server/services/auth.service";

// Idempotent: logging out without a valid session still clears the cookie and returns 204.
export const POST = route(async () => {
  await authService.logout(await readSessionCookie());
  await clearSessionCookie();
  return new Response(null, { status: 204 });
});
