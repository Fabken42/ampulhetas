import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { getRemainingMs } from '@/lib/time'
import { colorHex } from '@/lib/colors'
import { updateFavicon, resetFavicon } from '@/lib/favicon'
import { useIsLight } from './useTheme'

/** Atualiza o favicon conforme o estado (respeitando a preferência do usuário). */
export function useFavicon(now: number) {
  const session = useAppStore((s) => s.session)
  const screen = useAppStore((s) => s.screen)
  const enabled = useAppStore((s) => s.settings.dynamicFavicon)
  const light = useIsLight()

  useEffect(() => {
    if (!enabled) {
      resetFavicon()
      return
    }

    if (screen === 'session' && session.activeId != null) {
      const active = session.activities.find((a) => a.id === session.activeId)
      if (active && active.plannedMs > 0) {
        const remaining = Math.max(0, getRemainingMs(active, session, now))
        updateFavicon({
          kind: 'active',
          color: colorHex(active.color, light),
          fraction: remaining / active.plannedMs,
        })
        return
      }
    }

    if (screen === 'session' && session.startedAt != null) {
      updateFavicon({ kind: 'paused' })
      return
    }

    updateFavicon({ kind: 'none' })
  }, [enabled, screen, session, now, light])
}
