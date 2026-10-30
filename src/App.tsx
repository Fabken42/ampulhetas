import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { onStorageHealthChange } from '@/lib/storage'
import { useEngine } from '@/hooks/useEngine'
import { useTheme } from '@/hooks/useTheme'
import { useNow } from '@/hooks/useNow'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useFavicon } from '@/hooks/useFavicon'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useUndoToast } from '@/hooks/useUndoToast'
import { ToastContainer } from '@/components/common/Toast'
import { ShortcutsPanel } from '@/components/common/ShortcutsPanel'
import { SetupScreen } from '@/components/setup/SetupScreen'
import { SessionScreen } from '@/components/session/SessionScreen'
import { SummaryScreen } from '@/components/summary/SummaryScreen'
import { PresetsPanel } from '@/components/presets/PresetsPanel'
import { HistoryPanel } from '@/components/history/HistoryPanel'
import { SettingsPanel } from '@/components/settings/SettingsPanel'

export default function App() {
  const screen = useAppStore((s) => s.screen)
  const storageOk = useAppStore((s) => s.storageOk)
  const now = useNow()
  useTheme()
  useEngine()
  useDocumentTitle(now)
  useFavicon(now)
  useKeyboardShortcuts()
  useUndoToast()

  useEffect(() => onStorageHealthChange((ok) => useAppStore.setState({ storageOk: ok })), [])

  return (
    <div className="min-h-full">
      {!storageOk && (
        <div className="bg-amber-500/15 px-4 py-2 text-center text-xs text-amber-300">
          Não foi possível salvar os dados neste navegador. O site funciona, mas nada será mantido
          ao recarregar.
        </div>
      )}

      {screen === 'setup' && <SetupScreen />}
      {screen === 'session' && <SessionScreen />}
      {screen === 'summary' && <SummaryScreen />}

      <PresetsPanel />
      <HistoryPanel />
      <SettingsPanel />
      <ShortcutsPanel />
      <ToastContainer />
    </div>
  )
}
