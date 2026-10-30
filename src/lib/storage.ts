import type { StateStorage } from 'zustand/middleware'
import type { HistoryEntry, Preset, Settings } from '@/types'

/**
 * Storage resiliente: usa localStorage quando disponível; se faltar ou estourar
 * a quota, cai para um Map em memória e sinaliza via callback (o site continua
 * funcionando, só não persiste entre recargas).
 */
let storageHealthy = true
const memory = new Map<string, string>()
const listeners = new Set<(ok: boolean) => void>()

export function onStorageHealthChange(fn: (ok: boolean) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function isStorageHealthy(): boolean {
  return storageHealthy
}

function markUnhealthy() {
  if (storageHealthy) {
    storageHealthy = false
    listeners.forEach((fn) => fn(false))
  }
}

export const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name)
    } catch {
      return memory.get(name) ?? null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      memory.set(name, value)
      markUnhealthy()
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      memory.delete(name)
    }
  },
}

export type ExportBundle = {
  app: 'ampulhetas'
  version: number
  exportedAt: number
  presets: Preset[]
  history: HistoryEntry[]
  settings: Settings
}

export function buildExport(data: {
  presets: Preset[]
  history: HistoryEntry[]
  settings: Settings
}): ExportBundle {
  return {
    app: 'ampulhetas',
    version: 1,
    exportedAt: Date.now(),
    presets: data.presets,
    history: data.history,
    settings: data.settings,
  }
}

export type ParsedImport = {
  presets: Preset[]
  history: HistoryEntry[]
  settings: Partial<Settings>
}

/** Valida e normaliza um JSON de importação. Lança Error com mensagem amigável. */
export function parseImport(text: string): ParsedImport {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('O arquivo não é um JSON válido.')
  }
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Formato de arquivo não reconhecido.')
  }
  const obj = raw as Record<string, unknown>
  if (obj.app !== undefined && obj.app !== 'ampulhetas') {
    throw new Error('Este arquivo não parece ser um backup do Ampulhetas.')
  }
  const presets = Array.isArray(obj.presets) ? (obj.presets as Preset[]) : []
  const history = Array.isArray(obj.history) ? (obj.history as HistoryEntry[]) : []
  const settings =
    typeof obj.settings === 'object' && obj.settings !== null
      ? (obj.settings as Partial<Settings>)
      : {}

  // validação mínima de estrutura
  const presetsOk = presets.every(
    (p) => p && typeof p.name === 'string' && Array.isArray(p.activities),
  )
  const historyOk = history.every(
    (h) => h && typeof h.startedAt === 'number' && Array.isArray(h.activities),
  )
  if (!presetsOk || !historyOk) {
    throw new Error('A estrutura dos dados é inválida.')
  }
  return { presets, history, settings }
}

/** Dispara o download de um arquivo .json no navegador. */
export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
