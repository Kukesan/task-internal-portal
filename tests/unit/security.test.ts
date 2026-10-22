import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/auth/constants";
import { ForbiddenError } from "@/lib/errors";
import { assertSameOrigin } from "@/lib/security/origin";

const APP_URL = "http://localhost:3000";

describe("assertSameOrigin (CSRF)", () => {
  const check = (headers: Record<string, string>) => () =>
    assertSameOrigin(new Headers(headers), APP_URL);

  it("allows the configured app origin", () => {
    expect(check({ origin: "http://localhost:3000", host: "localhost:3000" })).not.toThrow();
  });

  it("allows an origin matching the Host header", () => {
    expect(
      check({ origin: "https://portal.example.com", host: "portal.example.com" }),
    ).not.toThrow();
  });

  it("blocks a foreign origin", () => {
    expect(check({ origin: "https://evil.example", host: "localhost:3000" })).toThrow(
      ForbiddenError,
    );
  });

  it("blocks a malformed origin", () => {
    expect(check({ origin: "null", host: "localhost:3000" })).toThrow(ForbiddenError);
  });

  it("falls back to Sec-Fetch-Site when Origin is missing", () => {
    expect(check({ "sec-fetch-site": "cross-site" })).toThrow(ForbiddenError);
    expect(check({ "sec-fetch-site": "same-origin" })).not.toThrow();
  });

  it("allows non-browser clients that send neither header", () => {
    expect(check({})).not.toThrow();
  });
});

describe("safeRedirectPath", () => {
  it.each([
    ["/tasks/new", "/tasks/new"],
    [undefined, "/tasks"],
    ["https://evil.example", "/tasks"],
    ["//evil.example", "/tasks"],
    ["/\\evil.example", "/tasks"],
  ])("%s → %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });
});
