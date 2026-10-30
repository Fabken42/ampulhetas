import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'
import { useNow } from '@/hooks/useNow'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { AddActivityRow } from '@/components/setup/AddActivityRow'
import { ActivityCard } from './ActivityCard'
import { TopBar } from './TopBar'
import { BlockPickerModal } from './BlockPickerModal'
import { TransferModal } from './TransferModal'
import { EditActivityModal } from './EditActivityModal'
import { PipButton } from './PipButton'

export function SessionScreen() {
  const now = useNow()
  const activities = useAppStore((s) => s.session.activities)
  const endSession = useAppStore((s) => s.endSession)
  const hasUndo = useAppStore((s) => s.undo != null)
  const undoLastSwitch = useAppStore((s) => s.undoLastSwitch)
  const addOpen = useUiStore((s) => s.addOpen)
  const setAddOpen = useUiStore((s) => s.setAddOpen)
  const openPanel = useUiStore((s) => s.openPanel)
  const [confirmEnd, setConfirmEnd] = useState(false)

  return (
    <div className="flex min-h-full flex-col">
      <TopBar now={now} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {activities.length === 0 ? (
          <p className="py-16 text-center text-stone-500">
            Nenhuma atividade. Adicione uma para começar.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((a, i) => (
              <ActivityCard key={a.id} activity={a} index={i} now={now} />
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setAddOpen(true)}>
            + Nova atividade <span className="text-xs text-stone-500">(N)</span>
          </Button>
          <Button variant="ghost" onClick={() => openPanel('shortcuts')} aria-label="Atalhos de teclado">
            ? Atalhos
          </Button>
          <PipButton />
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-stone-800 bg-stone-950/85 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2">
          {hasUndo ? (
            <Button variant="ghost" onClick={undoLastSwitch}>
              ↩ Desfazer
            </Button>
          ) : (
            <span />
          )}
          <Button variant="danger" onClick={() => setConfirmEnd(true)}>
            Encerrar sessão
          </Button>
        </div>
      </footer>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Adicionar atividade">
        <AddActivityRow autoFocusName />
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={() => setAddOpen(false)}>
            Fechar
          </Button>
        </div>
      </Modal>

      <Modal open={confirmEnd} onClose={() => setConfirmEnd(false)} title="Encerrar sessão?">
        <p className="mb-4 text-sm text-stone-400">
          O resumo será salvo no histórico. Você pode começar uma nova sessão depois.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmEnd(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setConfirmEnd(false)
              endSession()
            }}
          >
            Encerrar
          </Button>
        </div>
      </Modal>

      <BlockPickerModal />
      <TransferModal />
      <EditActivityModal />
    </div>
  )
}
