import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'
import { Button } from '@/components/common/Button'
import { AppMenu } from '@/components/common/AppMenu'
import { SummaryView } from './SummaryView'

export function SummaryScreen() {
  const entry = useAppStore((s) => s.lastSummary)
  const newSession = useAppStore((s) => s.newSession)
  const savePreset = useAppStore((s) => s.savePreset)
  const openPanel = useUiStore((s) => s.openPanel)

  if (!entry) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12 text-center">
        <p className="text-stone-400">Nenhum resumo disponível.</p>
        <Button variant="primary" className="mt-4" onClick={newSession}>
          Nova sessão
        </Button>
      </div>
    )
  }

  function onSavePreset() {
    const name = window.prompt('Nome do preset:')
    if (name && name.trim()) savePreset(name.trim())
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-stone-100">Resumo da sessão</h1>
        <AppMenu />
      </header>

      <SummaryView entry={entry} />

      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={() => openPanel('history')}>
          Ver histórico
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" onClick={onSavePreset}>
            Salvar como preset
          </Button>
          <Button variant="primary" onClick={newSession}>
            Nova sessão
          </Button>
        </div>
      </div>
    </div>
  )
}
