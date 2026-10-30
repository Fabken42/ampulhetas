import type { Activity } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { formatClock, formatDuration, getRemainingMs, MINUTE } from '@/lib/time'
import { colorHex } from '@/lib/colors'
import { useIsLight } from '@/hooks/useTheme'
import { CardMenu } from './CardMenu'

type Props = {
  activity: Activity
  index: number
  now: number
}

export function ActivityCard({ activity, index, now }: Props) {
  const session = useAppStore((s) => s.session)
  const activate = useAppStore((s) => s.activate)
  const adjustTime = useAppStore((s) => s.adjustTime)
  const light = useIsLight()

  const remaining = getRemainingMs(activity, session, now)
  const isActive = session.activeId === activity.id
  const isZero = remaining <= 0
  const frac = activity.plannedMs > 0 ? Math.max(0, Math.min(1, remaining / activity.plannedMs)) : 0
  const hex = colorHex(activity.color, light)
  const shortcut = index < 9 ? index + 1 : null

  const blockRemaining =
    isActive && session.blockEndsAt != null ? session.blockEndsAt - now : null

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all ${
        isActive
          ? 'border-transparent shadow-lg'
          : isZero
            ? 'border-stone-800 opacity-70'
            : 'border-stone-800 hover:border-stone-600'
      }`}
      style={
        isActive
          ? { boxShadow: `0 0 0 2px ${hex}, 0 8px 30px -8px ${hex}80` }
          : undefined
      }
    >
      {/* preenchimento de "areia" que esvazia conforme o tempo passa */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 transition-[height] duration-700 ease-linear"
        style={{ height: `${frac * 100}%`, backgroundColor: hex, opacity: isActive ? 0.22 : 0.12 }}
      />
      {isActive && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1 animate-sand-fall"
          style={{ backgroundColor: hex }}
        />
      )}

      <button
        type="button"
        aria-pressed={isActive}
        aria-label={`${activity.name}: ${formatClock(Math.max(0, remaining))} restantes${
          isZero ? ' (concluída)' : ''
        }`}
        onClick={() => {
          if (isZero && !isActive) return
          activate(activity.id)
        }}
        className="relative flex w-full flex-col gap-3 p-4 text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: hex }} />
            <span className="truncate font-semibold text-stone-100">{activity.name}</span>
          </div>
          {shortcut && (
            <span className="rounded-md border border-stone-700 px-1.5 text-xs text-stone-500 tnum">
              {shortcut}
            </span>
          )}
        </div>

        <div>
          <div
            className={`tnum text-4xl font-bold tabular-nums ${isZero ? 'text-stone-500' : 'text-stone-50'}`}
          >
            {formatClock(Math.max(0, remaining))}
          </div>
          <div className="mt-0.5 text-xs text-stone-500">
            de {formatDuration(activity.plannedMs)}
            {blockRemaining != null && blockRemaining > 0 && (
              <span className="ml-2 text-stone-400">
                · Bloco: {formatClock(blockRemaining)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium">
          {isZero ? (
            <span className="rounded-full bg-stone-800 px-2 py-0.5 text-stone-400">Concluída</span>
          ) : isActive ? (
            <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${hex}30`, color: hex }}>
              Em andamento · toque para pausar
            </span>
          ) : (
            <span className="text-stone-500">Toque para ativar</span>
          )}
        </div>
      </button>

      {/* ações rápidas / menu */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1">
        {isZero && (
          <button
            type="button"
            onClick={() => adjustTime(activity.id, 5 * MINUTE)}
            className="rounded-lg bg-stone-800 px-2 py-1 text-xs font-semibold text-amber-400 hover:bg-stone-700"
          >
            +5 min
          </button>
        )}
        <CardMenu activity={activity} />
      </div>
    </div>
  )
}
