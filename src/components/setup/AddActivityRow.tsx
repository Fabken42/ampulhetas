import { useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { DurationInput } from '@/components/common/DurationInput'
import { Button } from '@/components/common/Button'

export function AddActivityRow({ autoFocusName = false }: { autoFocusName?: boolean }) {
  const addActivity = useAppStore((s) => s.addActivity)
  const [name, setName] = useState('')
  const [durMs, setDurMs] = useState<number | null>(null)
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  function submit() {
    const trimmed = name.trim()
    if (trimmed === '') {
      setError('Dê um nome à atividade.')
      nameRef.current?.focus()
      return
    }
    if (durMs == null || durMs <= 0) {
      setError('Informe uma duração válida (ex.: 30min).')
      return
    }
    addActivity(trimmed, durMs)
    setName('')
    setDurMs(null)
    setError('')
    nameRef.current?.focus()
  }

  return (
    <div className="rounded-xl border border-dashed border-stone-700 bg-stone-900/30 p-2">
      <div className="flex items-start gap-2">
        <div className="w-6" />
        <input
          ref={nameRef}
          type="text"
          autoFocus={autoFocusName}
          aria-label="Nome da nova atividade"
          placeholder="Nova atividade"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
          className="mt-1.5 min-w-0 flex-1 rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 placeholder:text-stone-600 focus:border-amber-500"
        />
        <div className="w-32 shrink-0">
          <DurationInput
            ariaLabel="Duração da nova atividade"
            value={durMs}
            onChange={(ms) => {
              setDurMs(ms)
              setError('')
            }}
            onEnter={submit}
          />
        </div>
        <Button
          size="sm"
          variant="primary"
          className="mt-1.5"
          onClick={submit}
          disabled={name.trim() === '' || durMs == null || durMs <= 0}
        >
          Adicionar
        </Button>
      </div>
      {error && <p className="px-8 text-xs text-red-400">{error}</p>}
    </div>
  )
}
