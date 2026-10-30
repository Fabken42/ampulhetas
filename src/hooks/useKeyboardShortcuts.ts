import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'

function isTyping(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null
  if (!node) return false
  const tag = node.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      const store = useAppStore.getState()
      const ui = useUiStore.getState()

      // desfazer (em qualquer tela)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (store.undo) {
          e.preventDefault()
          store.undoLastSwitch()
        }
        return
      }

      // legenda de atalhos
      if (e.key === '?') {
        ui.openPanel('shortcuts')
        return
      }

      if (store.screen !== 'session') return

      // pausar/retomar
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        if (store.session.activeId != null) store.pauseAll()
        else store.resume()
        return
      }

      // adicionar atividade
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        ui.setAddOpen(true)
        return
      }

      // 1–9: ativar atividade
      if (/^[1-9]$/.test(e.key)) {
        const idx = Number(e.key) - 1
        const act = store.session.activities[idx]
        if (act) store.activate(act.id)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
