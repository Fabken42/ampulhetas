import { create } from 'zustand'

export type ToastAction = {
  label: string
  onClick: () => void
}

export type Toast = {
  id: string
  message: string
  action?: ToastAction
  durationMs: number
  createdAt: number
}

type ToastState = {
  toasts: Toast[]
  push: (message: string, opts?: { action?: ToastAction; durationMs?: number }) => string
  dismiss: (id: string) => void
}

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (message, opts) => {
    const id = crypto.randomUUID()
    const toast: Toast = {
      id,
      message,
      action: opts?.action,
      durationMs: opts?.durationMs ?? 5000,
      createdAt: Date.now(),
    }
    set((s) => ({ toasts: [...s.toasts, toast] }))
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Atalho fora de componentes React. */
export function toast(message: string, opts?: { action?: ToastAction; durationMs?: number }) {
  return useToasts.getState().push(message, opts)
}
