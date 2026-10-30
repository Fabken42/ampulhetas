import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { DurationInput } from '@/components/common/DurationInput'
import { ColorPicker } from '@/components/common/ColorPicker'

export function EditActivityModal() {
  const id = useUiStore((s) => s.editFor)
  const close = useUiStore((s) => s.closeEdit)
  const activity = useAppStore((s) => s.session.activities.find((a) => a.id === id))
  const updateActivity = useAppStore((s) => s.updateActivity)

  const [name, setName] = useState('')
  const [color, setColor] = useState('amber')
  const [plannedMs, setPlannedMs] = useState<number | null>(null)

  useEffect(() => {
    if (activity) {
      setName(activity.name)
      setColor(activity.color)
      setPlannedMs(activity.plannedMs)
    }
  }, [activity])

  if (!id || !activity) return null

  function save() {
    updateActivity(id!, {
      name: name.trim() || activity!.name,
      color,
      ...(plannedMs != null && plannedMs > 0 ? { plannedMs } : {}),
    })
    close()
  }

  return (
    <Modal open={!!id} onClose={close} title="Editar atividade">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <ColorPicker value={color} onChange={setColor} />
          <input
            type="text"
            aria-label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 focus:border-amber-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-stone-300">Duração planejada</label>
          <DurationInput value={plannedMs} onChange={setPlannedMs} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={save}>
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
