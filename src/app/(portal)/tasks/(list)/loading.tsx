// Lives in the (list) group so it only wraps the list. A Suspense boundary above /tasks/[id]/edit
// would start streaming a 200 before notFound() runs, losing the real 404 status.
export default function TasksLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading tasks…</span>
      <div className="h-8 w-32 animate-pulse rounded bg-slate-200" />
      <ul className="space-y-3" aria-hidden="true">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i} className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
          </li>
        ))}
      </ul>
    </div>
  );
}
