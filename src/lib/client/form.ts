import type { ZodError } from "zod";

export type FieldErrors = Partial<Record<string, string>>;

/** First message per field, for inline display next to each input. */
export function firstFieldErrors(
  details: Record<string, string[] | undefined> | undefined,
): FieldErrors {
  const result: FieldErrors = {};
  for (const [field, messages] of Object.entries(details ?? {})) {
    if (messages?.[0]) result[field] = messages[0];
  }
  return result;
}

export function zodFieldErrors(error: ZodError): FieldErrors {
  return firstFieldErrors(error.flatten().fieldErrors as Record<string, string[] | undefined>);
}

export function formDataToObject(form: HTMLFormElement): Record<string, string> {
  const result: Record<string, string> = {};
  new FormData(form).forEach((value, key) => {
    if (typeof value === "string") result[key] = value;
  });
  return result;
}
