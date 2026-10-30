import { useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'
import type { Theme } from '@/types'
import { downloadJson } from '@/lib/storage'
import {
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
} from '@/lib/notifications'
import { playBeep } from '@/lib/sound'
import { toast } from '@/components/common/toastStore'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'dark', label: 'Escuro' },
  { value: 'light', label: 'Claro' },
  { value: 'system', label: 'Sistema' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-stone-800 py-4 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-sm font-semibold text-stone-200">{title}</h3>
      {children}
    </section>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 py-1 text-left text-sm text-stone-300"
    >
      <span>{label}</span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-amber-500' : 'bg-stone-700'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}
        />
      </span>
    </button>
  )
}

export function SettingsPanel() {
  const open = useUiStore((s) => s.panel === 'settings')
  const close = useUiStore((s) => s.closePanel)
  const settings = useAppStore((s) => s.settings)
  const setSettings = useAppStore((s) => s.setSettings)
  const setTheme = useAppStore((s) => s.setTheme)
  const exportData = useAppStore((s) => s.exportData)
  const importData = useAppStore((s) => s.importData)
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<string | null>(null)

  function onExport() {
    const date = new Date().toISOString().slice(0, 10)
    downloadJson(`ampulhetas-${date}.json`, JSON.parse(exportData()))
    toast('Dados exportados')
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setPendingImport(text)
    e.target.value = ''
  }

  function doImport(mode: 'merge' | 'replace') {
    if (!pendingImport) return
    try {
      importData(pendingImport, mode)
      toast(mode === 'merge' ? 'Dados mesclados' : 'Dados substituídos')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Falha ao importar')
    }
    setPendingImport(null)
  }

  async function toggleNotifications(v: boolean) {
    if (v && notificationPermission() !== 'granted') {
      const result = await requestNotificationPermission()
      setSettings({ notificationsEnabled: result === 'granted' })
      if (result !== 'granted') toast('Permissão de notificação negada')
      return
    }
    setSettings({ notificationsEnabled: v })
  }

  return (
    <Modal open={open} onClose={close} title="Configurações" maxWidth="max-w-md">
      <Section title="Tema">
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm ${
                settings.theme === t.value
                  ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                  : 'border-stone-700 text-stone-300 hover:bg-stone-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Som">
        <Toggle
          label="Tocar som ao terminar"
          checked={settings.soundEnabled}
          onChange={(v) => setSettings({ soundEnabled: v })}
        />
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.soundVolume}
            aria-label="Volume"
            disabled={!settings.soundEnabled}
            onChange={(e) => setSettings({ soundVolume: Number(e.target.value) })}
            className="flex-1 accent-amber-500"
          />
          <Button size="sm" variant="secondary" onClick={() => playBeep(settings.soundVolume)}>
            Testar
          </Button>
        </div>
      </Section>

      <Section title="Notificações">
        {notificationsSupported() ? (
          <Toggle
            label="Notificar quando algo terminar"
            checked={settings.notificationsEnabled}
            onChange={toggleNotifications}
          />
        ) : (
          <p className="text-sm text-stone-500">
            Este navegador não suporta notificações. Avisos aparecem como toast + som.
          </p>
        )}
      </Section>

      <Section title="Aparência">
        <Toggle
          label="Favicon dinâmico (anel de progresso)"
          checked={settings.dynamicFavicon}
          onChange={(v) => setSettings({ dynamicFavicon: v })}
        />
      </Section>

      <Section title="Dados">
        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={onExport}>
            Exportar dados (.json)
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Importar dados…
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onFile}
          />
        </div>
      </Section>

      <Modal open={pendingImport != null} onClose={() => setPendingImport(null)} title="Importar dados">
        <p className="mb-4 text-sm text-stone-400">
          Como deseja aplicar os dados importados?
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={() => doImport('merge')}>
            Mesclar com os dados atuais
          </Button>
          <Button variant="danger" onClick={() => doImport('replace')}>
            Substituir tudo
          </Button>
          <Button variant="ghost" onClick={() => setPendingImport(null)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </Modal>
  )
}
