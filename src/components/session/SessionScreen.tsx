import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'
import { useNow } from '@/hooks/useNow'
import { getTotalRemainingMs } from '@/lib/time'
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
  const session = useAppStore((s) => s.session)
  const activities = session.activities
  const endSession = useAppStore((s) => s.endSession)
  const pauseAll = useAppStore((s) => s.pauseAll)
  const resume = useAppStore((s) => s.resume)
  const hasUndo = useAppStore((s) => s.undo != null)
  const undoLastSwitch = useAppStore((s) => s.undoLastSwitch)
  const addOpen = useUiStore((s) => s.addOpen)
  const setAddOpen = useUiStore((s) => s.setAddOpen)
  const openPanel = useUiStore((s) => s.openPanel)
  const [confirmEnd, setConfirmEnd] = useState(false)

  const isRunning = session.activeId != null
  const totalRemaining = getTotalRemainingMs(session, now)
  const lastActive = activities.find((a) => a.id === session.lastActiveId)
  const canResume = lastActive != null && lastActive.plannedMs - lastActive.usedMs > 0

  // concluídas vão para o fim; o atalho (1–9) continua preso à ordem original
  const ordered = activities
    .map((a, index) => ({
      a,
      index,
      done: a.id !== session.activeId && a.plannedMs - a.usedMs <= 0,
    }))
    .sort((x, y) => Number(x.done) - Number(y.done))

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
            {ordered.map(({ a, index }) => (
              <ActivityCard key={a.id} activity={a} index={index} now={now} />
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => setAddOpen(true)}>
            + Nova atividade <span className="text-xs text-stone-500">(N)</span>
          </Button>
          <Button variant="ghost" onClick={() => openPanel('shortcuts')} aria-label="Atalhos de teclado">
            ? Atalhos
          </Button>
          <PipButton />
          <Button
            variant="ghost"
            className="text-stone-500 hover:text-red-400"
            onClick={() => setConfirmEnd(true)}
          >
            Encerrar sessão
          </Button>
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-stone-800 bg-stone-950/85 px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2">
          {hasUndo && (
            <Button variant="ghost" onClick={undoLastSwitch} aria-label="Desfazer última troca">
              ↩
            </Button>
          )}
          {isRunning ? (
            <Button variant="secondary" size="lg" className="flex-1" onClick={pauseAll}>
              ⏸ Pausar tudo
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={resume}
              disabled={!canResume || totalRemaining <= 0}
            >
              ▶ Retomar
            </Button>
          )}
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
