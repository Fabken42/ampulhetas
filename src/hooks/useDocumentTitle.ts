import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { formatClock, getRemainingMs } from '@/lib/time'

/** Mantém o título da aba em sincronia com o estado da sessão. */
export function useDocumentTitle(now: number) {
  const session = useAppStore((s) => s.session)
  const screen = useAppStore((s) => s.screen)

  useEffect(() => {
    let title = 'Ampulhetas'
    if (screen === 'session') {
      if (session.activeId != null) {
        const active = session.activities.find((a) => a.id === session.activeId)
        if (active) {
          const remaining = Math.max(0, getRemainingMs(active, session, now))
          title = `${formatClock(remaining)} · ${active.name} — Ampulhetas`
        }
      } else if (session.startedAt != null) {
        title = '⏸ Pausado — Ampulhetas'
      }
    }
    document.title = title
  }, [screen, session, now])
}
