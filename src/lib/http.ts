import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType, type ZodTypeDef } from "zod";
import { AppError, RateLimitedError, type ErrorCode } from "@/lib/errors";
import { assertSameOrigin } from "@/lib/security/origin";
import { env } from "@/lib/env";

export type ApiErrorBody = {
  error: { code: ErrorCode; message: string; details?: Record<string, string[] | undefined> };
};

export function jsonError(
  status: number,
  code: ErrorCode,
  message: string,
  details?: ApiErrorBody["error"]["details"],
  headers?: HeadersInit,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status, headers },
  );
}

function toErrorResponse(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof ZodError) {
    return jsonError(
      400,
      "VALIDATION_ERROR",
      "Please correct the highlighted fields.",
      error.flatten().fieldErrors,
    );
  }
  if (error instanceof RateLimitedError) {
    return jsonError(error.status, error.code, error.message, undefined, {
      "Retry-After": String(error.retryAfterSeconds),
    });
  }
  if (error instanceof AppError) {
    return jsonError(error.status, error.code, error.message, error.details);
  }
  console.error("[api] unhandled error", error);
  return jsonError(500, "INTERNAL_ERROR", "Something went wrong.");
}

type RouteContext<P> = { params: Promise<P> };
type Handler<P> = (req: NextRequest, ctx: RouteContext<P>) => Promise<Response>;

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Wraps a route handler with the cross-cutting concerns every endpoint needs:
 * CSRF origin check on mutating methods and mapping thrown errors to the JSON error envelope.
 */
export function route<P = Record<string, never>>(handler: Handler<P>): Handler<P> {
  return async (req, ctx) => {
    try {
      if (MUTATING_METHODS.has(req.method)) assertSameOrigin(req.headers, env.APP_URL);
      return await handler(req, ctx);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

/** Parses and validates a JSON body; throws ZodError (→ 400) or AppError on malformed JSON. */
export async function parseJson<T>(
  req: Request,
  schema: ZodType<T, ZodTypeDef, unknown>,
): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError("BAD_REQUEST", 400, "Request body must be valid JSON.");
  }
  return schema.parse(body);
}

/** Best-effort client IP for rate limiting. Trust X-Forwarded-For only behind a proxy you control. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}
