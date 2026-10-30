import { useEffect, useState } from 'react'

/**
 * Re-renderiza a cada `intervalMs` (1s por padrão) e imediatamente quando a aba
 * volta a ficar visível. Retorna o timestamp atual (Date.now()).
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') setNow(Date.now())
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onVisibility)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onVisibility)
    }
  }, [intervalMs])

  return now
}
