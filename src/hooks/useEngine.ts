import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { getTotalRemainingMs, formatTimeOfDay } from '@/lib/time'
import { toast } from '@/components/common/toastStore'
import { playBeep, unlockAudio } from '@/lib/sound'
import { cancelScheduled, scheduleNext, showNotification } from '@/lib/notifications'
import { useNow } from './useNow'

/**
 * Motor da sessão: a cada tick (1s / visibilitychange) e no disparo preciso
 * agendado, chama reconcile via store e reage aos eventos de fim com
 * toast + som + notificação. Encerra automaticamente quando tudo zera.
 */
export function useEngine() {
  const now = useNow()
  const firstRun = useRef(true)

  function processTick(ts: number) {
    const store = useAppStore.getState()
    if (store.screen !== 'session') return

    const events = store.tick(ts)
    for (const ev of events) {
      const st = useAppStore.getState()
      const act = st.session.activities.find((a) => a.id === ev.activityId)
      const name = act?.name ?? 'Atividade'
      const base =
        ev.type === 'activity-finished' ? `${name} terminou` : `Bloco de ${name} concluído`

      // "enquanto o site estava fechado": só quando é o primeiro tick após o load
      const fromClosed = firstRun.current && ts - ev.at > 2000

      if (fromClosed) {
        toast(`${base} às ${formatTimeOfDay(ev.at)} enquanto o site estava fechado`)
      } else {
        toast(base)
        if (st.settings.soundEnabled) playBeep(st.settings.soundVolume)
        if (st.settings.notificationsEnabled) showNotification(base)
      }
    }

    const st2 = useAppStore.getState()
    if (
      st2.screen === 'session' &&
      st2.session.startedAt != null &&
      st2.session.activities.length > 0 &&
      getTotalRemainingMs(st2.session, ts) <= 0
    ) {
      st2.endSession()
    }

    firstRun.current = false
  }

  // tick regular
  useEffect(() => {
    processTick(now)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now])

  // destrava o áudio no primeiro gesto do usuário
  useEffect(() => {
    const onGesture = () => unlockAudio()
    window.addEventListener('pointerdown', onGesture, { once: true })
    window.addEventListener('keydown', onGesture, { once: true })
    return () => {
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
    }
  }, [])

  // agendamento preciso do próximo fim: reagenda quando a chave muda
  const scheduleKey = useAppStore((s) => {
    if (s.screen !== 'session' || s.session.activeId == null) return 'idle'
    const a = s.session.activities.find((x) => x.id === s.session.activeId)
    return `${s.session.activeId}:${s.session.activeSince}:${s.session.blockEndsAt}:${a?.plannedMs}:${a?.usedMs}`
  })

  useEffect(() => {
    const store = useAppStore.getState()
    if (store.screen !== 'session' || store.session.activeId == null) {
      cancelScheduled()
      return
    }
    scheduleNext(store.session, () => processTick(Date.now()))
    return () => cancelScheduled()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleKey])
}
