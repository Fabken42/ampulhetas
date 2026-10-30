import { useEffect, useRef, useState } from 'react'
import { formatDuration, parseDuration } from '@/lib/time'

type Props = {
  value: number | null // ms; null = vazio
  onChange: (ms: number | null) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
  ariaLabel?: string
  onEnter?: () => void
}

/**
 * Campo de duração que aceita os formatos de parseDuration e mostra o valor
 * interpretado (ex.: "= 4h"). Não bloqueia a digitação; só valida ao interpretar.
 */
export function DurationInput({
  value,
  onChange,
  placeholder = 'ex.: 1h30, 90, 45min',
  autoFocus,
  className = '',
  ariaLabel,
  onEnter,
}: Props) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  // sincroniza o texto quando o valor externo muda e o campo não está em foco
  useEffect(() => {
    if (!focused) setText(value != null && value > 0 ? formatDuration(value) : '')
  }, [value, focused])

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  const parsed = text.trim() === '' ? null : parseDuration(text)
  const invalid = text.trim() !== '' && parsed === null

  function commit(raw: string) {
    const p = raw.trim() === '' ? null : parseDuration(raw)
    onChange(p)
  }

  return (
    <div className={className}>
      <input
        ref={ref}
        type="text"
        inputMode="text"
        aria-label={ariaLabel}
        value={text}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          commit(text)
        }}
        onChange={(e) => {
          setText(e.target.value)
          commit(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit(text)
            onEnter?.()
          }
        }}
        className={`w-full rounded-xl border bg-stone-900 px-3 py-2 text-stone-100 placeholder:text-stone-600 tnum ${
          invalid ? 'border-red-500' : 'border-stone-700 focus:border-amber-500'
        }`}
      />
      <div className="mt-1 h-4 text-xs">
        {invalid ? (
          <span className="text-red-400">Formato não reconhecido</span>
        ) : parsed != null && parsed > 0 ? (
          <span className="text-stone-500">= {formatDuration(parsed)}</span>
        ) : null}
      </div>
    </div>
  )
}
