import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'
import { formatDuration, getRemainingMs } from '@/lib/time'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { DurationInput } from '@/components/common/DurationInput'

export function TransferModal() {
  const fromId = useUiStore((s) => s.transferFrom)
  const close = useUiStore((s) => s.closeTransfer)
  const session = useAppStore((s) => s.session)
  const transferTime = useAppStore((s) => s.transferTime)

  const from = session.activities.find((a) => a.id === fromId)
  const others = session.activities.filter((a) => a.id !== fromId)
  const [toId, setToId] = useState<string>('')
  const [amount, setAmount] = useState<number | null>(null)

  if (!fromId || !from) return null

  const max = Math.max(0, getRemainingMs(from, session, Date.now()))
  const target = toId || others[0]?.id || ''

  function doTransfer() {
    if (!target || amount == null || amount <= 0) return
    transferTime(fromId!, target, amount)
    close()
  }

  return (
    <Modal open={!!fromId} onClose={close} title="Transferir tempo">
      <p className="mb-4 text-sm text-stone-400">
        De <span className="font-semibold text-stone-200">{from.name}</span> (máx.{' '}
        {formatDuration(max)}) para outra atividade.
      </p>

      {others.length === 0 ? (
        <p className="text-sm text-stone-500">Não há outra atividade para receber o tempo.</p>
      ) : (
        <>
          <label className="mb-1 block text-sm text-stone-300">Para</label>
          <select
            value={target}
            onChange={(e) => setToId(e.target.value)}
            className="mb-4 w-full rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 focus:border-amber-500"
          >
            {others.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <label className="mb-1 block text-sm text-stone-300">Quanto</label>
          <DurationInput value={amount} onChange={setAmount} placeholder="ex.: 10min" />

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              disabled={amount == null || amount <= 0 || max <= 0}
              onClick={doTransfer}
            >
              Transferir
            </Button>
          </div>
          {amount != null && amount > max && (
            <p className="mt-2 text-xs text-amber-300">
              Será transferido no máximo {formatDuration(max)} (o restante da origem).
            </p>
          )}
        </>
      )}
    </Modal>
  )
}
