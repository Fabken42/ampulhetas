import { useEffect } from 'react'
import { useToasts } from './toastStore'

function ToastItem({ id }: { id: string }) {
  const toast = useToasts((s) => s.toasts.find((t) => t.id === id))
  const dismiss = useToasts((s) => s.dismiss)

  useEffect(() => {
    if (!toast) return
    const timeLeft = toast.durationMs - (Date.now() - toast.createdAt)
    const timer = window.setTimeout(() => dismiss(id), Math.max(0, timeLeft))
    return () => window.clearTimeout(timer)
  }, [id, toast, dismiss])

  if (!toast) return null

  return (
    <div className="pointer-events-auto flex animate-toast-in items-center gap-3 rounded-xl border border-stone-700 bg-stone-900/95 px-4 py-3 text-sm text-stone-100 shadow-lg shadow-black/40 backdrop-blur">
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick()
            dismiss(id)
          }}
          className="rounded-lg px-2 py-1 font-semibold text-amber-400 hover:bg-stone-800"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Fechar aviso"
        onClick={() => dismiss(id)}
        className="rounded-lg px-1.5 text-stone-500 hover:bg-stone-800 hover:text-stone-200"
      >
        ×
      </button>
    </div>
  )
}

export function ToastContainer() {
  const ids = useToasts((s) => s.toasts.map((t) => t.id))
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-end"
    >
      {ids.map((id) => (
        <ToastItem key={id} id={id} />
      ))}
    </div>
  )
}
