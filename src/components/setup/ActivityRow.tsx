import type { Activity } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { DurationInput } from '@/components/common/DurationInput'
import { ColorPicker } from '@/components/common/ColorPicker'

type Props = {
  activity: Activity
  index: number
  total: number
}

export function ActivityRow({ activity, index, total }: Props) {
  const updateActivity = useAppStore((s) => s.updateActivity)
  const removeActivity = useAppStore((s) => s.removeActivity)
  const reorder = useAppStore((s) => s.reorderActivities)
  const activities = useAppStore((s) => s.session.activities)

  function move(dir: -1 | 1) {
    const ids = activities.map((a) => a.id)
    const from = ids.indexOf(activity.id)
    const to = from + dir
    if (to < 0 || to >= ids.length) return
    ;[ids[from], ids[to]] = [ids[to], ids[from]]
    reorder(ids)
  }

  return (
    <div className="flex items-start gap-2 rounded-xl border border-stone-800 bg-stone-900/50 p-2">
      <div className="flex flex-col pt-2">
        <button
          type="button"
          aria-label="Mover para cima"
          disabled={index === 0}
          onClick={() => move(-1)}
          className="px-1 text-stone-500 enabled:hover:text-stone-200 disabled:opacity-30"
        >
          ▲
        </button>
        <button
          type="button"
          aria-label="Mover para baixo"
          disabled={index === total - 1}
          onClick={() => move(1)}
          className="px-1 text-stone-500 enabled:hover:text-stone-200 disabled:opacity-30"
        >
          ▼
        </button>
      </div>

      <div className="pt-2.5">
        <ColorPicker value={activity.color} onChange={(color) => updateActivity(activity.id, { color })} />
      </div>

      <input
        type="text"
        aria-label="Nome da atividade"
        value={activity.name}
        onChange={(e) => updateActivity(activity.id, { name: e.target.value })}
        className="mt-1.5 min-w-0 flex-1 rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 focus:border-amber-500"
      />

      <div className="w-32 shrink-0">
        <DurationInput
          ariaLabel="Duração da atividade"
          value={activity.plannedMs}
          onChange={(ms) => ms != null && updateActivity(activity.id, { plannedMs: ms })}
        />
      </div>

      <button
        type="button"
        aria-label={`Remover ${activity.name}`}
        onClick={() => removeActivity(activity.id)}
        className="mt-1.5 rounded-lg px-2 py-2 text-stone-500 hover:bg-stone-800 hover:text-red-400"
      >
        🗑
      </button>
    </div>
  )
}
