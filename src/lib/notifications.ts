import type { Session } from '@/types'

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission {
  if (!notificationsSupported()) return 'denied'
  return Notification.permission
}

/** Pede permissão (deve ser chamado após um gesto do usuário). */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function showNotification(body: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try {
    new Notification('Ampulhetas', { body, tag: 'ampulhetas', renotify: true } as NotificationOptions)
  } catch {
    // alguns ambientes exigem service worker; silenciosamente ignora
  }
}

/** Instante exato do próximo fim: min(fim da atividade ativa, fim do bloco). */
export function nextStopAt(session: Session): number | null {
  if (session.activeId == null || session.activeSince == null) return null
  const active = session.activities.find((a) => a.id === session.activeId)
  if (!active) return null
  let stopAt = session.activeSince + (active.plannedMs - active.usedMs)
  if (session.blockEndsAt != null && session.blockEndsAt < stopAt) stopAt = session.blockEndsAt
  return stopAt
}

// agendador de disparo preciso (um único timer global)
let timer: number | null = null

export function cancelScheduled() {
  if (timer != null) {
    window.clearTimeout(timer)
    timer = null
  }
}

/** Agenda `onFire` para o instante exato do próximo fim; cancela o anterior. */
export function scheduleNext(session: Session, onFire: () => void) {
  cancelScheduled()
  const stopAt = nextStopAt(session)
  if (stopAt == null) return
  const delay = Math.max(0, stopAt - Date.now())
  timer = window.setTimeout(onFire, delay)
}
