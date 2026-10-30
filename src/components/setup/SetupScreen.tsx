import { useAppStore } from '@/store/useAppStore'
import { DurationInput } from '@/components/common/DurationInput'
import { TimeOfDayInput } from '@/components/common/TimeOfDayInput'
import { Button } from '@/components/common/Button'
import {
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
} from '@/lib/notifications'
import { AppMenu } from '@/components/common/AppMenu'
import { useUiStore } from '@/store/useUiStore'
import { ActivityRow } from './ActivityRow'
import { AddActivityRow } from './AddActivityRow'
import { AllocationIndicator } from './AllocationIndicator'

export function SetupScreen() {
  const session = useAppStore((s) => s.session)
  const setAvailable = useAppStore((s) => s.setAvailable)
  const setDeadline = useAppStore((s) => s.setDeadline)
  const startSession = useAppStore((s) => s.startSession)
  const savePreset = useAppStore((s) => s.savePreset)
  const setSettings = useAppStore((s) => s.setSettings)
  const openPanel = useUiStore((s) => s.openPanel)

  const canStart = session.activities.length > 0 && session.availableMs > 0

  async function onStart() {
    // pede permissão de notificação na primeira vez (gesto do usuário)
    if (notificationsSupported() && notificationPermission() === 'default') {
      const result = await requestNotificationPermission()
      setSettings({ notificationsEnabled: result === 'granted' })
    } else if (notificationPermission() === 'granted') {
      setSettings({ notificationsEnabled: true })
    }
    startSession()
  }

  function onSavePreset() {
    const name = window.prompt('Nome do preset:')
    if (name && name.trim()) savePreset(name.trim())
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-100">
            Ampulhetas<span className="text-amber-400">.</span>
          </h1>
          <p className="mt-1 text-sm text-stone-400">
            Distribua seu tempo entre atividades e alterne livremente entre elas.
          </p>
        </div>
        <AppMenu />
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-300">Tempo disponível</label>
          <DurationInput
            ariaLabel="Tempo disponível"
            value={session.availableMs || null}
            onChange={(ms) => setAvailable(ms ?? 0)}
            placeholder="ex.: 4h"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-300">
            Livre até <span className="text-stone-500">(opcional)</span>
          </label>
          <TimeOfDayInput ariaLabel="Hora limite" value={session.deadline} onChange={setDeadline} />
          <p className="mt-1 h-4 text-xs text-stone-500">Avisa se a previsão passar desse horário.</p>
        </div>
      </section>

      <section className="mb-4">
        <h2 className="mb-2 text-sm font-medium text-stone-300">Atividades</h2>
        <div className="flex flex-col gap-2">
          {session.activities.map((a, i) => (
            <ActivityRow key={a.id} activity={a} index={i} total={session.activities.length} />
          ))}
          <AddActivityRow autoFocusName={session.activities.length === 0} />
        </div>
      </section>

      <section className="mb-8">
        <AllocationIndicator />
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => openPanel('presets')}>
            Carregar preset
          </Button>
          <Button variant="ghost" onClick={onSavePreset} disabled={session.activities.length === 0}>
            Salvar como preset
          </Button>
        </div>
        <div className="flex flex-col items-stretch gap-1 sm:items-end">
          <Button variant="primary" size="lg" onClick={onStart} disabled={!canStart}>
            Iniciar sessão
          </Button>
          {!canStart && (
            <p className="text-xs text-stone-500">
              {session.availableMs <= 0
                ? 'Informe o tempo disponível.'
                : 'Adicione ao menos uma atividade.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
