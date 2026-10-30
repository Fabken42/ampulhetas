import type { Activity, ReconcileEvent, Segment, Session } from '@/types'

export const MINUTE = 60_000
export const HOUR = 3_600_000

/**
 * Tempo restante de uma atividade.
 * Ativa:   plannedMs - usedMs - (now - activeSince)
 * Inativa: plannedMs - usedMs
 * Pode retornar valor negativo (o chamador decide se clampa em 0).
 */
export function getRemainingMs(activity: Activity, session: Session, now: number): number {
  const base = activity.plannedMs - activity.usedMs
  if (session.activeId === activity.id && session.activeSince != null) {
    return base - (now - session.activeSince)
  }
  return base
}

/** Soma de max(0, restante) de todas as atividades. */
export function getTotalRemainingMs(session: Session, now: number): number {
  return session.activities.reduce(
    (sum, a) => sum + Math.max(0, getRemainingMs(a, session, now)),
    0,
  )
}

/** Soma das durações planejadas. */
export function getAllocatedMs(activities: Activity[]): number {
  return activities.reduce((sum, a) => sum + a.plannedMs, 0)
}

/**
 * Diferença entre o disponível e o alocado.
 * Positivo = sobra (tempo não alocado); negativo = excedente.
 */
export function getAllocationDiffMs(session: Session): number {
  return session.availableMs - getAllocatedMs(session.activities)
}

/** Previsão de término = agora + total restante. */
export function getEta(session: Session, now: number): number {
  return now + getTotalRemainingMs(session, now)
}

/** Fecha, em `at`, o último segmento em andamento (end === null). */
export function closeOpenSegment(log: Segment[], at: number): Segment[] {
  if (log.length === 0) return log
  const last = log[log.length - 1]
  if (last.end !== null) return log
  const copy = log.slice()
  copy[copy.length - 1] = { ...last, end: at }
  return copy
}

/**
 * Reconciliação: verifica se a atividade ativa (ou o mini-timer de bloco)
 * chegou ao fim entre o último tick e `now`. Se chegou, consolida o tempo
 * ATÉ o instante exato do fim (`stopAt`), fecha o segmento, pausa a sessão
 * e devolve um evento descrevendo o que terminou.
 */
export function reconcile(
  session: Session,
  now: number,
): { session: Session; events: ReconcileEvent[] } {
  if (session.activeId == null || session.activeSince == null) {
    return { session, events: [] }
  }

  const activity = session.activities.find((a) => a.id === session.activeId)
  if (!activity) {
    // atividade ativa foi removida; apenas entra em pausa
    const log = closeOpenSegment(session.log, now)
    return {
      session: { ...session, activeId: null, activeSince: null, blockEndsAt: null, pausedSince: now, log },
      events: [],
    }
  }

  const fimAtividade = session.activeSince + (activity.plannedMs - activity.usedMs)
  let stopAt = fimAtividade
  let kind: ReconcileEvent['type'] = 'activity-finished'

  if (session.blockEndsAt != null && session.blockEndsAt < stopAt) {
    stopAt = session.blockEndsAt
    kind = 'block-finished'
  }

  if (stopAt > now) {
    return { session, events: [] }
  }

  const elapsed = Math.max(0, stopAt - session.activeSince)
  const activities = session.activities.map((a) =>
    a.id === activity.id ? { ...a, usedMs: a.usedMs + elapsed } : a,
  )
  let log = closeOpenSegment(session.log, stopAt)
  // abre o segmento de pausa que começa exatamente quando a atividade parou
  log = [...log, { activityId: null, start: stopAt, end: null }]

  const nextSession: Session = {
    ...session,
    activities,
    log,
    activeId: null,
    activeSince: null,
    lastActiveId: activity.id,
    blockEndsAt: null,
    pausedSince: stopAt,
  }

  return { session: nextSession, events: [{ type: kind, activityId: activity.id, at: stopAt }] }
}

/**
 * Converte texto em milissegundos.
 * Aceita "1h30", "1h 30min", "90" (min), "1:30", "45min", "2h", "1.5h".
 * Retorna `null` se inválido.
 */
export function parseDuration(text: string): number | null {
  if (text == null) return null
  const s = text.trim().toLowerCase().replace(',', '.')
  if (s === '') return null

  // formato relógio h:mm ou h:mm:ss
  const clock = s.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/)
  if (clock) {
    const h = Number(clock[1])
    const m = Number(clock[2])
    const sec = clock[3] != null ? Number(clock[3]) : 0
    if (m >= 60 || sec >= 60) return null
    return ((h * 60 + m) * 60 + sec) * 1000
  }

  // número puro => minutos
  if (/^\d+(\.\d+)?$/.test(s)) {
    return Math.round(Number(s) * MINUTE)
  }

  // formato com unidades: Xh Ymin / Xh / Ymin
  let rest = ` ${s} `
  let ms = 0
  let matched = false

  const hMatch = rest.match(/(\d+(?:\.\d+)?)\s*h/)
  if (hMatch) {
    ms += Number(hMatch[1]) * HOUR
    rest = rest.replace(hMatch[0], ' ')
    matched = true
  }

  const mMatch = rest.match(/(\d+(?:\.\d+)?)\s*(?:min|m)?/)
  if (mMatch && /\d/.test(mMatch[0])) {
    ms += Number(mMatch[1]) * MINUTE
    rest = rest.replace(mMatch[0], ' ')
    matched = true
  }

  if (!matched) return null
  if (/\S/.test(rest)) return null // sobrou lixo não reconhecido
  return Math.round(ms)
}

/** Converte "HH:MM" + referência `now` em timestamp (hoje ou amanhã se já passou). */
export function parseTimeOfDay(text: string, now: number): number | null {
  const m = text.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  const d = new Date(now)
  d.setHours(h, min, 0, 0)
  let ts = d.getTime()
  if (ts <= now) ts += 24 * HOUR
  return ts
}

/** "1:05:09" (com horas) ou "23:41" (sem horas quando < 1h). */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const sec = total % 60
  const ss = String(sec).padStart(2, '0')
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`
  return `${m}:${ss}`
}

/** "1h 30min", "45min", "2h". */
export function formatDuration(ms: number): string {
  const totalMin = Math.round(Math.max(0, ms) / MINUTE)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0) return `${h}h`
  return `${m}min`
}

/** Hora do dia local: "17:06". */
export function formatTimeOfDay(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
