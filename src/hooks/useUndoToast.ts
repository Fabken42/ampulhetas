import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/components/common/toastStore'

/** Mostra um toast "desfazer" por 30s sempre que uma troca/pausa gera um snapshot. */
export function useUndoToast() {
  const undoAt = useAppStore((s) => s.undo?.createdAt ?? null)
  const prev = useRef<number | null>(null)

  useEffect(() => {
    if (undoAt == null) {
      prev.current = null
      return
    }
    if (prev.current === undoAt) return
    prev.current = undoAt

    const st = useAppStore.getState()
    const active = st.session.activities.find((a) => a.id === st.session.activeId)
    const msg = active ? `Trocou para ${active.name}` : 'Sessão pausada'

    toast(msg, {
      durationMs: 30_000,
      action: { label: 'Desfazer', onClick: () => useAppStore.getState().undoLastSwitch() },
    })

    // expira o snapshot após o TTL
    const timer = window.setTimeout(() => {
      const s = useAppStore.getState()
      if (s.undo?.createdAt === undoAt) s.clearUndo()
    }, 30_000)
    return () => window.clearTimeout(timer)
  }, [undoAt])
}

