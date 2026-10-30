import { describe, expect, it } from 'vitest'
import type { HistoryEntry } from '@/types'
import { computeStats, DAY } from './stats'
import { MINUTE } from './time'

function entry(endedAt: number, acts: [string, string, number][]): HistoryEntry {
  return {
    id: Math.random().toString(),
    startedAt: endedAt - HOUR,
    endedAt,
    availableMs: 0,
    pausedMs: 0,
    activities: acts.map(([name, color, usedMin]) => ({
      id: name,
      name,
      color,
      plannedMs: usedMin * MINUTE,
      usedMs: usedMin * MINUTE,
    })),
    log: [],
  }
}

const HOUR = 3_600_000

describe('computeStats', () => {
  const now = 1_000_000_000_000

  it('agrupa por nome e soma na janela', () => {
    const history = [
      entry(now - 1 * DAY, [['Leitura', 'amber', 30], ['Trabalho', 'blue', 60]]),
      entry(now - 3 * DAY, [['Leitura', 'amber', 15]]),
      entry(now - 10 * DAY, [['Leitura', 'amber', 99]]), // fora da janela de 7 dias
    ]
    const stats7 = computeStats(history, now, 7 * DAY)
    expect(stats7.find((s) => s.name === 'Leitura')!.totalMs).toBe(45 * MINUTE)
    expect(stats7.find((s) => s.name === 'Trabalho')!.totalMs).toBe(60 * MINUTE)
  })

  it('ordena do maior para o menor e inclui 30 dias', () => {
    const history = [entry(now - 10 * DAY, [['Leitura', 'amber', 99], ['A', 'blue', 5]])]
    const stats30 = computeStats(history, now, 30 * DAY)
    expect(stats30[0].name).toBe('Leitura')
    expect(stats30.map((s) => s.name)).toEqual(['Leitura', 'A'])
  })
})
