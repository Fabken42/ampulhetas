import { useEffect, useRef, useState } from 'react'
import type { Activity } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'

type Props = {
  activity: Activity
}

/** Menu do card (⋯). */
export function CardMenu({ activity }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const removeActivity = useAppStore((s) => s.removeActivity)
  const completeActivity = useAppStore((s) => s.completeActivity)
  const isActive = useAppStore((s) => s.session.activeId === activity.id)
  const openBlock = useUiStore((s) => s.openBlockPicker)
  const openTransfer = useUiStore((s) => s.openTransfer)
  const openEdit = useUiStore((s) => s.openEdit)

  const isDone = !isActive && activity.usedMs >= activity.plannedMs

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  function run(fn: () => void) {
    fn()
    setOpen(false)
  }

  const item =
    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-200 hover:bg-stone-700 disabled:cursor-not-allowed disabled:text-stone-600 disabled:hover:bg-transparent'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Ações de ${activity.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg bg-stone-800/80 px-2 py-1 text-stone-400 hover:bg-stone-700 hover:text-stone-100"
      >
        ⋯
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-9 right-0 z-30 w-48 overflow-hidden rounded-xl border border-stone-700 bg-stone-800 py-1 shadow-xl"
        >
          <button
            role="menuitem"
            className={item}
            disabled={isDone}
            onClick={() => run(() => openBlock(activity.id))}
          >
            ⏳ Ativar por um tempo…
          </button>
          <button
            role="menuitem"
            className={item}
            disabled={isDone}
            onClick={() => run(() => completeActivity(activity.id))}
          >
            ✓ Concluir
          </button>
          <button
            role="menuitem"
            className={item}
            onClick={() => run(() => openTransfer(activity.id))}
          >
            ↔ Transferir tempo…
          </button>
          <button role="menuitem" className={item} onClick={() => run(() => openEdit(activity.id))}>
            ✏ Editar
          </button>
          <div className="my-1 border-t border-stone-700" />
          <button
            role="menuitem"
            className={item}
            disabled={isActive}
            onClick={() => run(() => removeActivity(activity.id))}
          >
            🗑 Remover
          </button>
        </div>
      )}
    </div>
  )
}
