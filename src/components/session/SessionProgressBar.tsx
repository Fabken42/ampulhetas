import { useAppStore } from '@/store/useAppStore'
import { getRemainingMs } from '@/lib/time'
import { colorHex } from '@/lib/colors'
import { useIsLight } from '@/hooks/useTheme'

/**
 * Barra fininha de progresso da sessão: cada atividade contribui com um segmento
 * proporcional ao tempo já gasto, na sua cor; o restante do planejado fica no trilho.
 */
export function SessionProgressBar({ now }: { now: number }) {
  const session = useAppStore((s) => s.session)
  const light = useIsLight()

  const totalPlanned = session.activities.reduce((sum, a) => sum + a.plannedMs, 0)
  if (totalPlanned <= 0) return null

  return (
    <div
      className="flex h-1.5 w-full overflow-hidden bg-stone-800"
      role="progressbar"
      aria-label="Progresso da sessão"
    >
      {session.activities.map((a) => {
        const remaining = Math.max(0, getRemainingMs(a, session, now))
        const consumed = Math.max(0, a.plannedMs - remaining)
        const pct = (consumed / totalPlanned) * 100
        if (pct <= 0) return null
        return (
          <div
            key={a.id}
            className="transition-[width] duration-700 ease-linear"
            style={{ width: `${pct}%`, backgroundColor: colorHex(a.color, light) }}
          />
        )
      })}
    </div>
  )
}
