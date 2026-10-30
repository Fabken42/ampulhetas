import type { HistoryEntry } from '@/types'
import { formatDuration, formatTimeOfDay } from '@/lib/time'
import { colorHex } from '@/lib/colors'
import { useIsLight } from '@/hooks/useTheme'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/50 px-3 py-2">
      <div className="text-xs text-stone-500">{label}</div>
      <div className="tnum text-lg font-semibold text-stone-100">{value}</div>
    </div>
  )
}

export function SummaryView({ entry }: { entry: HistoryEntry }) {
  const light = useIsLight()
  const totalUsed = entry.activities.reduce((s, a) => s + a.usedMs, 0)
  const nameById = new Map(entry.activities.map((a) => [a.id, a]))

  // segmentos consolidados do log (ignora segmento aberto sem fim)
  const segments = entry.log.filter((s) => s.end != null) as {
    activityId: string | null
    start: number
    end: number
  }[]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Tempo gasto" value={formatDuration(totalUsed)} />
        <Stat label="Tempo pausado" value={formatDuration(entry.pausedMs)} />
        <Stat label="Início" value={formatTimeOfDay(entry.startedAt)} />
        <Stat label="Fim" value={formatTimeOfDay(entry.endedAt)} />
      </div>

      {/* barra empilhada das proporções de tempo gasto */}
      {totalUsed > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-stone-300">Proporção do tempo gasto</h3>
          <div className="flex h-5 w-full overflow-hidden rounded-full bg-stone-800">
            {entry.activities
              .filter((a) => a.usedMs > 0)
              .map((a) => (
                <div
                  key={a.id}
                  title={`${a.name} · ${formatDuration(a.usedMs)}`}
                  style={{
                    width: `${(a.usedMs / totalUsed) * 100}%`,
                    backgroundColor: colorHex(a.color, light),
                  }}
                />
              ))}
          </div>
        </div>
      )}

      {/* planejado x gasto por atividade */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-stone-300">Planejado × gasto</h3>
        <div className="flex flex-col gap-3">
          {entry.activities.map((a) => {
            const max = Math.max(a.plannedMs, a.usedMs, 1)
            const hex = colorHex(a.color, light)
            return (
              <div key={a.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-stone-200">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hex }} />
                    {a.name}
                  </span>
                  <span className="tnum text-stone-400">
                    {formatDuration(a.usedMs)} / {formatDuration(a.plannedMs)}
                  </span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-stone-800">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-stone-600"
                    style={{ width: `${(a.plannedMs / max) * 100}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${(a.usedMs / max) * 100}%`, backgroundColor: hex }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* linha do tempo das trocas */}
      {segments.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-stone-300">Linha do tempo</h3>
          <ol className="flex flex-col gap-1 text-sm text-stone-400">
            {segments.map((s, i) => {
              const label = s.activityId == null ? 'Pausa' : (nameById.get(s.activityId)?.name ?? 'Removida')
              const hex = s.activityId == null ? '#78716c' : colorHex(nameById.get(s.activityId)?.color ?? 'amber', light)
              return (
                <li key={i} className="flex items-center gap-2">
                  <span className="tnum text-stone-500">
                    {formatTimeOfDay(s.start)}–{formatTimeOfDay(s.end)}
                  </span>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hex }} />
                  <span className="text-stone-200">{label}</span>
                  <span className="tnum text-xs text-stone-500">
                    ({formatDuration(s.end - s.start)})
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
