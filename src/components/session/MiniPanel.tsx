import { useAppStore } from '@/store/useAppStore'
import { useNow } from '@/hooks/useNow'
import { useIsLight } from '@/hooks/useTheme'
import { formatClock, getRemainingMs } from '@/lib/time'
import { colorHex } from '@/lib/colors'

/** Painel compacto renderizado dentro da janela Picture-in-Picture. */
export function MiniPanel() {
  const now = useNow()
  const session = useAppStore((s) => s.session)
  const activate = useAppStore((s) => s.activate)
  const pauseAll = useAppStore((s) => s.pauseAll)
  const resume = useAppStore((s) => s.resume)
  const light = useIsLight()

  const active = session.activities.find((a) => a.id === session.activeId)
  const hex = active ? colorHex(active.color, light) : '#78716c'

  return (
    <div className="flex h-screen w-screen flex-col gap-2 bg-stone-950 p-3 text-stone-100">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: hex }} />
        <span className="truncate text-sm font-semibold">
          {active ? active.name : 'Pausado'}
        </span>
      </div>

      <div className="tnum text-center text-4xl font-bold" style={{ color: active ? hex : undefined }}>
        {active ? formatClock(Math.max(0, getRemainingMs(active, session, now))) : '—'}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => (session.activeId != null ? pauseAll() : resume())}
          className="flex-1 rounded-lg bg-stone-800 py-1.5 text-sm font-semibold hover:bg-stone-700"
        >
          {session.activeId != null ? '⏸ Pausar' : '▶ Retomar'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1 overflow-y-auto">
        {session.activities.map((a) => {
          const remaining = getRemainingMs(a, session, now)
          const isActive = a.id === session.activeId
          return (
            <button
              key={a.id}
              type="button"
              disabled={remaining <= 0 && !isActive}
              onClick={() => activate(a.id)}
              className="flex items-center gap-1 rounded-md border border-stone-700 px-1.5 py-1 text-xs disabled:opacity-40"
              style={isActive ? { borderColor: colorHex(a.color, light) } : undefined}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: colorHex(a.color, light) }}
              />
              <span className="max-w-[72px] truncate">{a.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
