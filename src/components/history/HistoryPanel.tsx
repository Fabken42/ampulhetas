import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'
import { formatDuration } from '@/lib/time'
import { colorHex } from '@/lib/colors'
import { useIsLight } from '@/hooks/useTheme'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { SummaryView } from '@/components/summary/SummaryView'
import { StatsBars } from './StatsBars'

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function HistoryPanel() {
  const open = useUiStore((s) => s.panel === 'history')
  const close = useUiStore((s) => s.closePanel)
  const history = useAppStore((s) => s.history)
  const clearHistory = useAppStore((s) => s.clearHistory)
  const light = useIsLight()
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <Modal open={open} onClose={close} title="Histórico" maxWidth="max-w-2xl">
      {history.length === 0 ? (
        <p className="py-6 text-center text-sm text-stone-500">Nenhuma sessão encerrada ainda.</p>
      ) : (
        <div className="flex flex-col gap-6">
          <StatsBars />

          <div>
            <h3 className="mb-2 text-sm font-medium text-stone-300">Sessões</h3>
            <ul className="flex flex-col gap-2">
              {history.map((entry) => {
                const totalUsed = entry.activities.reduce((s, a) => s + a.usedMs, 0)
                const isOpen = expanded === entry.id
                return (
                  <li key={entry.id} className="rounded-xl border border-stone-800 bg-stone-900/50">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setExpanded(isOpen ? null : entry.id)}
                      className="flex w-full items-center justify-between gap-3 p-3 text-left"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-stone-100">
                          {formatDate(entry.startedAt)}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {entry.activities.map((a) => (
                            <span
                              key={a.id}
                              className="h-2 w-2 rounded-full"
                              title={a.name}
                              style={{ backgroundColor: colorHex(a.color, light) }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-stone-400">
                        <span className="tnum">{formatDuration(totalUsed)}</span>
                        <span aria-hidden>{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t border-stone-800 p-3">
                        <SummaryView entry={entry} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="flex justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                if (window.confirm('Limpar todo o histórico? Isto não pode ser desfeito.'))
                  clearHistory()
              }}
            >
              Limpar histórico
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
