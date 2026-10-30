import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'
import { formatDuration, getRemainingMs, MINUTE } from '@/lib/time'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { DurationInput } from '@/components/common/DurationInput'

const PRESETS = [10, 15, 20, 25, 30]

export function BlockPickerModal() {
  const id = useUiStore((s) => s.blockPickerFor)
  const close = useUiStore((s) => s.closeBlockPicker)
  const activate = useAppStore((s) => s.activate)
  const session = useAppStore((s) => s.session)
  const [custom, setCustom] = useState<number | null>(null)

  const activity = session.activities.find((a) => a.id === id)
  if (!id || !activity) return null

  const remaining = Math.max(0, getRemainingMs(activity, session, Date.now()))

  function start(ms: number) {
    activate(id!, ms)
    close()
  }

  return (
    <Modal open={!!id} onClose={close} title={`Ativar ${activity.name} por um tempo`}>
      <p className="mb-4 text-sm text-stone-400">
        A atividade pausa sozinha quando o bloco terminar. Restam {formatDuration(remaining)}.
      </p>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {PRESETS.map((min) => (
          <Button
            key={min}
            variant="secondary"
            disabled={remaining <= 0}
            onClick={() => start(min * MINUTE)}
          >
            {min} min
          </Button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-stone-400">Tempo personalizado</label>
          <DurationInput value={custom} onChange={setCustom} placeholder="ex.: 12min" />
        </div>
        <Button
          variant="primary"
          className="mb-5"
          disabled={custom == null || custom <= 0 || remaining <= 0}
          onClick={() => custom && start(custom)}
        >
          Ativar
        </Button>
      </div>
    </Modal>
  )
}
