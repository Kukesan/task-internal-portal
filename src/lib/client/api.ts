import type { ErrorCode } from "@/lib/errors";

export type ApiError = {
  status: number;
  code: ErrorCode;
  message: string;
  details?: Record<string, string[] | undefined>;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

const NETWORK_ERROR: ApiError = {
  status: 0,
  code: "INTERNAL_ERROR",
  message: "Network error. Check your connection and try again.",
};

function isErrorBody(value: unknown): value is { error: Omit<ApiError, "status"> } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "object"
  );
}

/** Thin fetch wrapper that always resolves to a typed success/error result. */
export async function apiFetch<T = void>(
  url: string,
  options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {},
): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? "GET",
      headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "same-origin",
    });
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }

  const payload: unknown = res.status === 204 ? undefined : await res.json().catch(() => undefined);

  if (res.ok) return { ok: true, data: payload as T };

  if (isErrorBody(payload)) return { ok: false, error: { status: res.status, ...payload.error } };
  return {
    ok: false,
    error: { status: res.status, code: "INTERNAL_ERROR", message: "Something went wrong." },
  };
}
