import { useCallback, useEffect, useState } from 'react'

type DocumentPiP = {
  requestWindow: (opts?: { width?: number; height?: number }) => Promise<Window>
  window: Window | null
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPiP
  }
}

/** Copia as folhas de estilo da página para a janela PiP (para o Tailwind funcionar lá). */
function copyStyles(target: Window) {
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const cssText = Array.from(sheet.cssRules)
        .map((r) => r.cssText)
        .join('\n')
      const style = target.document.createElement('style')
      style.textContent = cssText
      target.document.head.appendChild(style)
    } catch {
      // folha cross-origin: recria o <link>
      if (sheet.href) {
        const link = target.document.createElement('link')
        link.rel = 'stylesheet'
        link.href = sheet.href
        target.document.head.appendChild(link)
      }
    }
  }
}

export function usePictureInPicture() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null)
  const supported =
    typeof window !== 'undefined' && 'documentPictureInPicture' in window

  const open = useCallback(async () => {
    if (!supported || !window.documentPictureInPicture) return
    try {
      const w = await window.documentPictureInPicture.requestWindow({ width: 320, height: 190 })
      copyStyles(w)
      w.document.documentElement.classList.toggle(
        'light',
        document.documentElement.classList.contains('light'),
      )
      w.document.body.style.margin = '0'
      w.addEventListener('pagehide', () => setPipWindow(null), { once: true })
      setPipWindow(w)
    } catch {
      setPipWindow(null)
    }
  }, [supported])

  const close = useCallback(() => {
    pipWindow?.close()
    setPipWindow(null)
  }, [pipWindow])

  useEffect(() => {
    return () => {
      pipWindow?.close()
    }
  }, [pipWindow])

  return { supported, pipWindow, open, close }
}
