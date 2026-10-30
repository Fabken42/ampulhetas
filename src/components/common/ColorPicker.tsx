import { useEffect, useRef, useState } from 'react'
import { PALETTE, colorHex } from '@/lib/colors'

type Props = {
  value: string
  onChange: (key: string) => void
  light?: boolean
}

/** Bolinha clicável que abre um pequeno seletor com a paleta. */
export function ColorPicker({ value, onChange, light }: Props) {
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
        aria-label="Trocar a cor da atividade"
        onClick={() => setOpen((o) => !o)}
        className="h-6 w-6 rounded-full ring-2 ring-stone-700 ring-offset-1 ring-offset-stone-900 transition-transform hover:scale-110"
        style={{ backgroundColor: colorHex(value, light) }}
      />
      {open && (
        <div className="absolute left-0 top-8 z-20 grid grid-cols-4 gap-2 rounded-xl border border-stone-700 bg-stone-800 p-2 shadow-lg">
          {PALETTE.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-label={c.name}
              title={c.name}
              onClick={() => {
                onChange(c.key)
                setOpen(false)
              }}
              className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${
                c.key === value ? 'ring-2 ring-white ring-offset-1 ring-offset-stone-800' : ''
              }`}
              style={{ backgroundColor: colorHex(c.key, light) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
