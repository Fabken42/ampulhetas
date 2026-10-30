import { useEffect, useState } from 'react'
import { formatTimeOfDay, parseTimeOfDay } from '@/lib/time'

type Props = {
  value: number | null // timestamp
  onChange: (ts: number | null) => void
  ariaLabel?: string
}

export function TimeOfDayInput({ value, onChange, ariaLabel }: Props) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(value != null ? formatTimeOfDay(value) : '')
  }, [value, focused])

  const invalid = text.trim() !== '' && parseTimeOfDay(text, Date.now()) === null

  function commit(raw: string) {
    const t = raw.trim()
    if (t === '') {
      onChange(null)
      return
    }
    const ts = parseTimeOfDay(t, Date.now())
    if (ts != null) onChange(ts)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={ariaLabel}
      placeholder="ex.: 19:00"
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        commit(text)
      }}
      onChange={(e) => setText(e.target.value)}
      className={`w-28 rounded-xl border bg-stone-900 px-3 py-2 text-stone-100 placeholder:text-stone-600 tnum ${
        invalid ? 'border-red-500' : 'border-stone-700 focus:border-amber-500'
      }`}
    />
  )
}
