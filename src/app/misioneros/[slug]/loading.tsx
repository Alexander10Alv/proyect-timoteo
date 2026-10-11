export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        <p className="text-body-md font-medium text-sky-100">Cargando misionero…</p>
        <span className="sr-only">Cargando</span>
      </div>
    </div>
  );
}