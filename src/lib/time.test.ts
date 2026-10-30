import { describe, expect, it } from 'vitest'
import type { Activity, Session } from '@/types'
import {
  HOUR,
  MINUTE,
  formatClock,
  formatDuration,
  formatTimeOfDay,
  getAllocationDiffMs,
  getEta,
  getRemainingMs,
  getTotalRemainingMs,
  parseDuration,
  parseTimeOfDay,
  reconcile,
} from './time'

function act(id: string, plannedMin: number, usedMin = 0): Activity {
  return { id, name: id, color: 'amber', plannedMs: plannedMin * MINUTE, usedMs: usedMin * MINUTE }
}

function session(partial: Partial<Session> = {}): Session {
  return {
    id: 's',
    availableMs: 4 * HOUR,
    deadline: null,
    activities: [],
    activeId: null,
    activeSince: null,
    lastActiveId: null,
    blockEndsAt: null,
    startedAt: null,
    pausedMs: 0,
    pausedSince: null,
    log: [],
    ...partial,
  }
}

describe('parseDuration', () => {
  it('aceita todos os formatos pedidos', () => {
    expect(parseDuration('1h30')).toBe(90 * MINUTE)
    expect(parseDuration('1h 30min')).toBe(90 * MINUTE)
    expect(parseDuration('90')).toBe(90 * MINUTE)
    expect(parseDuration('1:30')).toBe(90 * MINUTE)
    expect(parseDuration('45min')).toBe(45 * MINUTE)
    expect(parseDuration('2h')).toBe(120 * MINUTE)
  })

  it('aceita variações extras', () => {
    expect(parseDuration('1h30min')).toBe(90 * MINUTE)
    expect(parseDuration('1.5h')).toBe(90 * MINUTE)
    expect(parseDuration('1:05:09')).toBe((65 * 60 + 9) * 1000)
    expect(parseDuration('0:45')).toBe(45 * MINUTE)
    expect(parseDuration('  2h  ')).toBe(120 * MINUTE)
  })

  it('rejeita entradas inválidas', () => {
    expect(parseDuration('')).toBeNull()
    expect(parseDuration('abc')).toBeNull()
    expect(parseDuration('-5')).toBeNull()
    expect(parseDuration('1:70')).toBeNull()
    expect(parseDuration('30xyz')).toBeNull()
    expect(parseDuration('h')).toBeNull()
  })
})

describe('parseTimeOfDay', () => {
  it('retorna hoje quando ainda não passou', () => {
    const now = new Date(2026, 9, 29, 10, 0, 0).getTime()
    const ts = parseTimeOfDay('19:00', now)!
    const d = new Date(ts)
    expect(d.getHours()).toBe(19)
    expect(d.getDate()).toBe(29)
  })

  it('pula para amanhã quando já passou', () => {
    const now = new Date(2026, 9, 29, 20, 0, 0).getTime()
    const ts = parseTimeOfDay('19:00', now)!
    expect(new Date(ts).getDate()).toBe(30)
  })

  it('rejeita horários inválidos', () => {
    const now = Date.now()
    expect(parseTimeOfDay('25:00', now)).toBeNull()
    expect(parseTimeOfDay('12:99', now)).toBeNull()
    expect(parseTimeOfDay('abc', now)).toBeNull()
  })
})

describe('formatadores', () => {
  it('formatClock', () => {
    expect(formatClock((65 * 60 + 9) * 1000)).toBe('1:05:09')
    expect(formatClock((23 * 60 + 41) * 1000)).toBe('23:41')
    expect(formatClock(9 * 1000)).toBe('0:09')
    expect(formatClock(-5000)).toBe('0:00')
  })

  it('formatDuration', () => {
    expect(formatDuration(90 * MINUTE)).toBe('1h 30min')
    expect(formatDuration(45 * MINUTE)).toBe('45min')
    expect(formatDuration(2 * HOUR)).toBe('2h')
  })

  it('formatTimeOfDay', () => {
    const ts = new Date(2026, 0, 1, 17, 6).getTime()
    expect(formatTimeOfDay(ts)).toBe('17:06')
  })
})

describe('cálculos de restante e alocação', () => {
  it('restante de atividade inativa', () => {
    const s = session({ activities: [act('a', 30, 10)] })
    expect(getRemainingMs(s.activities[0], s, 1000)).toBe(20 * MINUTE)
  })

  it('restante de atividade ativa desconta o tempo corrido', () => {
    const t0 = 1_000_000
    const s = session({ activities: [act('a', 30)], activeId: 'a', activeSince: t0 })
    expect(getRemainingMs(s.activities[0], s, t0 + 5 * MINUTE)).toBe(25 * MINUTE)
  })

  it('total restante clampa negativos em 0', () => {
    const t0 = 0
    const s = session({
      activities: [act('a', 10), act('b', 20)],
      activeId: 'a',
      activeSince: t0,
    })
    // a estourou (passou de 10min), deve contar 0; b conta 20
    expect(getTotalRemainingMs(s, t0 + 15 * MINUTE)).toBe(20 * MINUTE)
  })

  it('diferença de alocação: sobra positiva, excedente negativo', () => {
    expect(getAllocationDiffMs(session({ availableMs: 4 * HOUR, activities: [act('a', 210)] }))).toBe(
      30 * MINUTE,
    )
    expect(
      getAllocationDiffMs(session({ availableMs: 4 * HOUR, activities: [act('a', 255)] })),
    ).toBe(-15 * MINUTE)
  })
})

describe('getEta', () => {
  it('pausado: agora + total restante (avança com o tempo)', () => {
    const now = 1_000_000
    const s = session({ activities: [act('a', 30), act('b', 30)] })
    expect(getEta(s, now)).toBe(now + 60 * MINUTE)
    expect(getEta(s, now + 10 * MINUTE)).toBe(now + 10 * MINUTE + 60 * MINUTE)
  })

  it('ativo: desconta o tempo corrido da atividade ativa', () => {
    const t0 = 1_000_000
    const s = session({ activities: [act('a', 30), act('b', 30)], activeId: 'a', activeSince: t0 })
    expect(getEta(s, t0 + 10 * MINUTE)).toBe(t0 + 10 * MINUTE + 50 * MINUTE)
  })
})

describe('reconcile', () => {
  it('não faz nada quando pausado', () => {
    const s = session({ activities: [act('a', 30)] })
    const { session: ns, events } = reconcile(s, 999)
    expect(events).toHaveLength(0)
    expect(ns).toBe(s)
  })

  it('não faz nada antes da atividade zerar', () => {
    const t0 = 0
    const s = session({
      activities: [act('a', 30)],
      activeId: 'a',
      activeSince: t0,
      log: [{ activityId: 'a', start: t0, end: null }],
    })
    const { events } = reconcile(s, t0 + 10 * MINUTE)
    expect(events).toHaveLength(0)
  })

  it('para no instante exato quando now está muito depois do fim', () => {
    const t0 = 0
    const s = session({
      activities: [act('a', 30)],
      activeId: 'a',
      activeSince: t0,
      log: [{ activityId: 'a', start: t0, end: null }],
    })
    const now = t0 + 3 * HOUR // reabriu 3h depois
    const { session: ns, events } = reconcile(s, now)
    expect(events).toEqual([{ type: 'activity-finished', activityId: 'a', at: 30 * MINUTE }])
    expect(ns.activeId).toBeNull()
    expect(ns.pausedSince).toBe(30 * MINUTE) // parou quando zerou, não em `now`
    expect(ns.activities[0].usedMs).toBe(30 * MINUTE) // consolidou exatamente o planejado
    expect(ns.lastActiveId).toBe('a')
    // segmento da atividade fechado no fim, e pausa aberta a partir dali
    expect(ns.log[0]).toEqual({ activityId: 'a', start: t0, end: 30 * MINUTE })
    expect(ns.log[1]).toEqual({ activityId: null, start: 30 * MINUTE, end: null })
  })

  it('bloco termina antes da atividade', () => {
    const t0 = 0
    const s = session({
      activities: [act('a', 30)],
      activeId: 'a',
      activeSince: t0,
      blockEndsAt: t0 + 20 * MINUTE,
      log: [{ activityId: 'a', start: t0, end: null }],
    })
    const { session: ns, events } = reconcile(s, t0 + 25 * MINUTE)
    expect(events).toEqual([{ type: 'block-finished', activityId: 'a', at: 20 * MINUTE }])
    expect(ns.activities[0].usedMs).toBe(20 * MINUTE) // sobra 10min na atividade
    expect(ns.blockEndsAt).toBeNull()
    expect(ns.activeId).toBeNull()
  })

  it('atividade ativa inexistente apenas pausa', () => {
    const s = session({ activities: [act('a', 30)], activeId: 'zzz', activeSince: 0 })
    const { session: ns, events } = reconcile(s, 1000)
    expect(events).toHaveLength(0)
    expect(ns.activeId).toBeNull()
    expect(ns.pausedSince).toBe(1000)
  })
})
