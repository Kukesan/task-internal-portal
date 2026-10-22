/** Form-level error banner. The alert region stays mounted so screen readers announce changes. */
export function FormError({ message }: { message: string | null }) {
  return (
    <div role="alert">
      {message && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {message}
        </p>
      )}
    </div>
  );
}
