import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { Theme } from '@/types'

function systemPrefersLight(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches
}

export function resolveTheme(theme: Theme, systemLight: boolean): 'dark' | 'light' {
  if (theme === 'system') return systemLight ? 'light' : 'dark'
  return theme
}

/**
 * Aplica o tema no <html> (classe `light`) e devolve o tema resolvido.
 * Reage a mudanças na preferência do sistema quando o tema é 'system'.
 */
export function useTheme(): 'dark' | 'light' {
  const theme = useAppStore((s) => s.settings.theme)
  const [systemLight, setSystemLight] = useState(systemPrefersLight)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => setSystemLight(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved = resolveTheme(theme, systemLight)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('light', resolved === 'light')
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', resolved === 'light' ? '#f5f5f4' : '#0c0a09')
  }, [resolved])

  return resolved
}

/** Apenas lê o tema resolvido (sem aplicar a classe no <html>). */
export function useIsLight(): boolean {
  const theme = useAppStore((s) => s.settings.theme)
  const [systemLight, setSystemLight] = useState(systemPrefersLight)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => setSystemLight(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return resolveTheme(theme, systemLight) === 'light'
}
