import { useEffect, useRef, useState } from 'react'
import { useUiStore, type Panel } from '@/store/useUiStore'

const ITEMS: { panel: Exclude<Panel, null>; label: string; icon: string }[] = [
  { panel: 'presets', label: 'Presets', icon: '📑' },
  { panel: 'history', label: 'Histórico', icon: '🕘' },
  { panel: 'settings', label: 'Configurações', icon: '⚙' },
]

export function AppMenu() {
  const openPanel = useUiStore((s) => s.openPanel)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-stone-300 hover:bg-stone-800 hover:text-stone-100"
      >
        ☰
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-30 w-44 overflow-hidden rounded-xl border border-stone-700 bg-stone-800 py-1 shadow-xl"
        >
          {ITEMS.map((item) => (
            <button
              key={item.panel}
              role="menuitem"
              onClick={() => {
                openPanel(item.panel)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-200 hover:bg-stone-700"
            >
              <span aria-hidden>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
