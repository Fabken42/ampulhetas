import { useAppStore } from '@/store/useAppStore'
import {
  formatClock,
  formatDuration,
  formatTimeOfDay,
  getAllocationDiffMs,
  getEta,
  getTotalRemainingMs,
} from '@/lib/time'
import { AppMenu } from '@/components/common/AppMenu'
import { SessionProgressBar } from './SessionProgressBar'

export function TopBar({ now }: { now: number }) {
  const session = useAppStore((s) => s.session)

  const totalRemaining = getTotalRemainingMs(session, now)
  const eta = getEta(session, now)
  const isRunning = session.activeId != null
  const pausedTotal = session.pausedMs + (session.pausedSince != null ? now - session.pausedSince : 0)

  // avisos compactos (só aparecem quando relevantes)
  const allocDiff = getAllocationDiffMs(session)
  let deadline: { text: string; warn: boolean } | null = null
  if (session.deadline != null) {
    const slack = session.deadline - eta
    deadline =
      slack >= 0
        ? { text: `Limite ${formatTimeOfDay(session.deadline)} · folga ${formatDuration(slack)}`, warn: false }
        : {
            text: `Previsão passa do limite ${formatTimeOfDay(session.deadline)} em ${formatDuration(-slack)}`,
            warn: true,
          }
  }

  return (
    <div className="sticky top-0 z-20 border-b border-stone-800 bg-stone-950/85 backdrop-blur">
      <SessionProgressBar now={now} />
      <div className="mx-auto w-full max-w-5xl px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="tnum text-2xl font-bold leading-none text-stone-50 sm:text-3xl">
              {formatClock(totalRemaining)}
            </span>
            <span className="text-xs text-stone-500">restante</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-sm leading-tight">
              {totalRemaining > 0 ? (
                <div className="text-stone-300">
                  {isRunning ? 'Termina ' : 'Se retomar: '}
                  <span className="font-semibold text-stone-100">{formatTimeOfDay(eta)}</span>
                </div>
              ) : (
                <div className="text-stone-400">Tudo concluído</div>
              )}
              {pausedTotal > 0 && (
                <div className="text-xs text-stone-500">Pausado {formatDuration(pausedTotal)}</div>
              )}
            </div>
            <AppMenu />
          </div>
        </div>

        {(deadline || allocDiff < 0) && (
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
            {deadline && (
              <span className={deadline.warn ? 'font-medium text-amber-300' : 'text-stone-500'}>
                {deadline.warn && <span aria-hidden>⚠ </span>}
                {deadline.text}
              </span>
            )}
            {allocDiff < 0 && (
              <span className="font-medium text-amber-300">
                <span aria-hidden>⚠ </span>
                {formatDuration(-allocDiff)} alocados a mais
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
