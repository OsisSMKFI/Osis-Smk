export default function Loading() {
  return (
    <div
      className="fixed inset-x-0 top-16 z-40 flex justify-center pointer-events-none"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mt-6 flex items-center gap-2 rounded-full border border-amber-200/70 bg-white/90 px-4 py-2 shadow-sm backdrop-blur">
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent"
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-slate-600">Memuat…</span>
      </div>
    </div>
  );
}
