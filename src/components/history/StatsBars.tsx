import { useAppStore } from '@/store/useAppStore'
import { computeStats, DAY } from '@/lib/stats'
import { formatDuration } from '@/lib/time'
import { colorHex } from '@/lib/colors'
import { useIsLight } from '@/hooks/useTheme'

function StatGroup({ label, windowMs }: { label: string; windowMs: number }) {
  const history = useAppStore((s) => s.history)
  const light = useIsLight()
  const stats = computeStats(history, Date.now(), windowMs)
  const max = stats.reduce((m, s) => Math.max(m, s.totalMs), 0)

  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</h4>
      {stats.length === 0 ? (
        <p className="text-sm text-stone-600">Sem dados no período.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {stats.map((s) => (
            <li key={s.name}>
              <div className="mb-0.5 flex justify-between text-sm">
                <span className="text-stone-300">{s.name}</span>
                <span className="tnum text-stone-400">{formatDuration(s.totalMs)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-800">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${max > 0 ? (s.totalMs / max) * 100 : 0}%`,
                    backgroundColor: colorHex(s.color, light),
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function StatsBars() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <StatGroup label="Últimos 7 dias" windowMs={7 * DAY} />
      <StatGroup label="Últimos 30 dias" windowMs={30 * DAY} />
    </div>
  )
}
