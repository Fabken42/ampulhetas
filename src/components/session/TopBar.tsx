import { useAppStore } from '@/store/useAppStore'
import {
  formatClock,
  formatDuration,
  formatTimeOfDay,
  getEta,
  getTotalRemainingMs,
} from '@/lib/time'
import { Button } from '@/components/common/Button'
import { AppMenu } from '@/components/common/AppMenu'
import { AllocationIndicator } from '@/components/setup/AllocationIndicator'

export function TopBar({ now }: { now: number }) {
  const session = useAppStore((s) => s.session)
  const pauseAll = useAppStore((s) => s.pauseAll)
  const resume = useAppStore((s) => s.resume)

  const totalRemaining = getTotalRemainingMs(session, now)
  const eta = getEta(session, now)
  const isRunning = session.activeId != null
  const pausedTotal = session.pausedMs + (session.pausedSince != null ? now - session.pausedSince : 0)

  const lastActive = session.activities.find((a) => a.id === session.lastActiveId)
  const canResume = lastActive != null && lastActive.plannedMs - lastActive.usedMs > 0

  // info de hora limite
  let deadlineInfo: { text: string; warn: boolean } | null = null
  if (session.deadline != null) {
    const slack = session.deadline - eta
    if (slack >= 0) {
      deadlineInfo = {
        text: `Limite ${formatTimeOfDay(session.deadline)} · folga de ${formatDuration(slack)}`,
        warn: false,
      }
    } else {
      deadlineInfo = {
        text: `A previsão passa do seu limite (${formatTimeOfDay(session.deadline)}) em ${formatDuration(-slack)}`,
        warn: true,
      }
    }
  }

  return (
    <div className="sticky top-0 z-20 border-b border-stone-800 bg-stone-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-bold tracking-tight text-stone-300">
            Ampulhetas<span className="text-amber-400">.</span>
          </span>
          <AppMenu />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-stone-500">Tempo restante</div>
            <div className="tnum text-3xl font-bold text-stone-50">{formatClock(totalRemaining)}</div>
          </div>

          <div className="text-right text-sm">
            {totalRemaining > 0 ? (
              <div className="text-stone-300">
                {isRunning ? 'Termina às ' : 'Se retomar agora: '}
                <span className="font-semibold text-stone-100">{formatTimeOfDay(eta)}</span>
              </div>
            ) : (
              <div className="text-stone-400">Tudo concluído</div>
            )}
            <div className="mt-0.5 text-xs text-stone-500">
              Pausado: {formatDuration(pausedTotal)}
            </div>
          </div>
        </div>

        {deadlineInfo && (
          <p
            className={`text-xs ${deadlineInfo.warn ? 'font-medium text-amber-300' : 'text-stone-500'}`}
          >
            {deadlineInfo.warn && <span aria-hidden>⚠ </span>}
            {deadlineInfo.text}
          </p>
        )}

        <AllocationIndicator compact />

        <div>
          {isRunning ? (
            <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={pauseAll}>
              ⏸ Pausar tudo
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
              onClick={resume}
              disabled={!canResume || totalRemaining <= 0}
            >
              ▶ Retomar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
