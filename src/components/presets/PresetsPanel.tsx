import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'
import { formatDuration } from '@/lib/time'
import { colorHex } from '@/lib/colors'
import { useIsLight } from '@/hooks/useTheme'
import { toast } from '@/components/common/toastStore'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'

export function PresetsPanel() {
  const open = useUiStore((s) => s.panel === 'presets')
  const close = useUiStore((s) => s.closePanel)
  const presets = useAppStore((s) => s.presets)
  const loadPreset = useAppStore((s) => s.loadPreset)
  const deletePreset = useAppStore((s) => s.deletePreset)
  const renamePreset = useAppStore((s) => s.renamePreset)
  const duplicatePreset = useAppStore((s) => s.duplicatePreset)
  const savePreset = useAppStore((s) => s.savePreset)
  const hasActivities = useAppStore((s) => s.session.activities.length > 0)
  const screen = useAppStore((s) => s.screen)
  const setScreen = useAppStore((s) => s.setScreen)
  const light = useIsLight()
  const [newName, setNewName] = useState('')

  function onLoad(id: string) {
    if (hasActivities && !window.confirm('Isto substitui as atividades atuais. Continuar?')) return
    loadPreset(id)
    if (screen !== 'setup') setScreen('setup')
    close()
    toast('Preset carregado')
  }

  return (
    <Modal open={open} onClose={close} title="Presets" maxWidth="max-w-lg">
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          aria-label="Nome do novo preset"
          placeholder="Salvar configuração atual como…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newName.trim()) {
              savePreset(newName.trim())
              setNewName('')
              toast('Preset salvo')
            }
          }}
          className="flex-1 rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 focus:border-amber-500"
        />
        <Button
          variant="primary"
          disabled={!hasActivities || newName.trim() === ''}
          onClick={() => {
            savePreset(newName.trim())
            setNewName('')
            toast('Preset salvo')
          }}
        >
          Salvar
        </Button>
      </div>

      {presets.length === 0 ? (
        <p className="py-6 text-center text-sm text-stone-500">Nenhum preset salvo ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {presets.map((p) => (
            <li key={p.id} className="rounded-xl border border-stone-800 bg-stone-900/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-stone-100">{p.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {p.activities.map((a, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 rounded-full bg-stone-800 px-2 py-0.5 text-xs text-stone-300"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: colorHex(a.color, light) }}
                        />
                        {a.name} · {formatDuration(a.plannedMs)}
                      </span>
                    ))}
                  </div>
                </div>
                <Button size="sm" variant="primary" onClick={() => onLoad(p.id)}>
                  Carregar
                </Button>
              </div>
              <div className="mt-2 flex gap-3 text-xs">
                <button
                  className="text-stone-400 hover:text-stone-100"
                  onClick={() => {
                    const name = window.prompt('Novo nome:', p.name)
                    if (name && name.trim()) renamePreset(p.id, name.trim())
                  }}
                >
                  Renomear
                </button>
                <button
                  className="text-stone-400 hover:text-stone-100"
                  onClick={() => duplicatePreset(p.id)}
                >
                  Duplicar
                </button>
                <button
                  className="text-stone-400 hover:text-red-400"
                  onClick={() => {
                    if (window.confirm(`Excluir o preset "${p.name}"?`)) deletePreset(p.id)
                  }}
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
