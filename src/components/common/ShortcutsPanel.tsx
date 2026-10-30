import { useUiStore } from '@/store/useUiStore'
import { Modal } from './Modal'

const SHORTCUTS: [string, string][] = [
  ['1 – 9', 'Ativar a atividade correspondente (ou pausá-la se já ativa)'],
  ['Espaço', 'Pausar tudo / retomar'],
  ['Ctrl/⌘ + Z', 'Desfazer a última troca'],
  ['N', 'Adicionar atividade'],
  ['?', 'Mostrar esta ajuda'],
]

export function ShortcutsPanel() {
  const open = useUiStore((s) => s.panel === 'shortcuts')
  const close = useUiStore((s) => s.closePanel)

  return (
    <Modal open={open} onClose={close} title="Atalhos de teclado">
      <dl className="flex flex-col gap-2">
        {SHORTCUTS.map(([key, desc]) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <dt>
              <kbd className="rounded-md border border-stone-600 bg-stone-800 px-2 py-0.5 text-xs text-stone-200">
                {key}
              </kbd>
            </dt>
            <dd className="flex-1 text-right text-sm text-stone-400">{desc}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}
