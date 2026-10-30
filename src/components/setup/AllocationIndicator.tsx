import { useState } from 'react'
import { getAllocationDiffMs } from '@/lib/time'
import { formatDuration } from '@/lib/time'
import { useAppStore } from '@/store/useAppStore'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'

export function AllocationIndicator({ compact = false }: { compact?: boolean }) {
  const session = useAppStore((s) => s.session)
  const distribute = useAppStore((s) => s.distributeUnallocated)
  const [open, setOpen] = useState(false)

  const diff = getAllocationDiffMs(session)
  const hasActivities = session.activities.length > 0

  // excedente (alocado > disponível): aviso âmbar
  if (diff < 0) {
    return (
      <p
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-amber-300 ${
          compact ? 'bg-transparent px-0 py-0' : 'border border-amber-500/40 bg-amber-500/10'
        }`}
        role="status"
      >
        <span aria-hidden>⚠</span>
        Você alocou {formatDuration(-diff)} a mais do que o tempo disponível.
      </p>
    )
  }

  if (compact) return null
  if (!hasActivities) return null

  // tudo alocado
  if (diff === 0) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
        <span aria-hidden>✓</span> Tudo alocado
      </p>
    )
  }

  // sobra
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-700 bg-stone-800/60 px-3 py-2 text-sm text-stone-300">
        <span>Faltam {formatDuration(diff)} para alocar</span>
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Distribuir sobra
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Distribuir sobra">
        <p className="mb-4 text-sm text-stone-400">
          Como deseja distribuir os {formatDuration(diff)} não alocados?
        </p>
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            onClick={() => {
              distribute('proportional')
              setOpen(false)
            }}
          >
            Proporcionalmente às durações
          </Button>
          <div className="my-1 text-center text-xs uppercase tracking-wide text-stone-600">
            ou para uma atividade
          </div>
          {session.activities.map((a) => (
            <Button
              key={a.id}
              variant="secondary"
              onClick={() => {
                distribute({ toId: a.id })
                setOpen(false)
              }}
            >
              {a.name}
            </Button>
          ))}
        </div>
      </Modal>
    </>
  )
}
