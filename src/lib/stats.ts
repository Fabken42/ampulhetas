import type { HistoryEntry } from '@/types'

export const DAY = 24 * 3_600_000

export type ActivityStat = { name: string; color: string; totalMs: number }

/**
 * Soma o tempo gasto por atividade (agrupando pelo nome) nas sessões encerradas
 * dentro da janela [now - windowMs, now]. Ordenado do maior para o menor.
 */
export function computeStats(
  history: HistoryEntry[],
  now: number,
  windowMs: number,
): ActivityStat[] {
  const since = now - windowMs
  const byName = new Map<string, ActivityStat>()
  for (const entry of history) {
    if (entry.endedAt < since) continue
    for (const a of entry.activities) {
      if (a.usedMs <= 0) continue
      const existing = byName.get(a.name)
      if (existing) existing.totalMs += a.usedMs
      else byName.set(a.name, { name: a.name, color: a.color, totalMs: a.usedMs })
    }
  }
  return [...byName.values()].sort((x, y) => y.totalMs - x.totalMs)
}
