import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Activity,
  HistoryEntry,
  Preset,
  ReconcileEvent,
  Session,
  Settings,
  Theme,
  UndoSnapshot,
} from '@/types'
import { closeOpenSegment, getRemainingMs, reconcile } from '@/lib/time'
import { nextColor } from '@/lib/colors'
import {
  buildExport,
  isStorageHealthy,
  parseImport,
  safeStorage,
} from '@/lib/storage'

export type Screen = 'setup' | 'session' | 'summary'

const UNDO_TTL = 30_000

const defaultSettings: Settings = {
  soundEnabled: true,
  soundVolume: 0.5,
  notificationsEnabled: false,
  theme: 'dark',
  dynamicFavicon: true,
}

function makeSession(availableMs = 0): Session {
  return {
    id: crypto.randomUUID(),
    availableMs,
    deadline: null,
    activities: [],
    activeId: null,
    activeSince: null,
    lastActiveId: null,
    blockEndsAt: null,
    startedAt: null,
    pausedMs: 0,
    pausedSince: null,
    log: [],
  }
}

/** Consolida o estado corrente (atividade ativa ou pausa) até `now`, deixando a sessão "neutra". */
function settle(session: Session, now: number): Session {
  const { session: s } = reconcile(session, now)
  if (s.activeId != null && s.activeSince != null) {
    const elapsed = Math.max(0, now - s.activeSince)
    const activities = s.activities.map((a) =>
      a.id === s.activeId ? { ...a, usedMs: a.usedMs + elapsed } : a,
    )
    const log = closeOpenSegment(s.log, now)
    return {
      ...s,
      activities,
      log,
      activeId: null,
      activeSince: null,
      blockEndsAt: null,
      lastActiveId: s.activeId,
    }
  }
  if (s.pausedSince != null) {
    const pausedMs = s.pausedMs + Math.max(0, now - s.pausedSince)
    const log = closeOpenSegment(s.log, now)
    return { ...s, pausedMs, pausedSince: null, log }
  }
  return s
}

function activateSession(session: Session, id: string, now: number, blockMs?: number): Session {
  const base = settle(session, now)
  const target = base.activities.find((a) => a.id === id)
  if (!target) return base
  const remaining = target.plannedMs - target.usedMs
  let blockEndsAt: number | null = null
  if (blockMs != null && blockMs > 0) {
    blockEndsAt = now + Math.min(blockMs, remaining)
  }
  return {
    ...base,
    activeId: id,
    activeSince: now,
    startedAt: base.startedAt ?? now,
    pausedSince: null,
    blockEndsAt,
    log: [...base.log, { activityId: id, start: now, end: null }],
  }
}

function pauseSession(session: Session, now: number): Session {
  const base = settle(session, now)
  return {
    ...base,
    pausedSince: now,
    log: [...base.log, { activityId: null, start: now, end: null }],
  }
}

type AppState = {
  screen: Screen
  session: Session
  presets: Preset[]
  history: HistoryEntry[]
  settings: Settings
  undo: UndoSnapshot | null
  lastSummary: HistoryEntry | null
  storageOk: boolean

  // navegação
  setScreen: (screen: Screen) => void
  startSession: () => void

  // setup / edição
  setAvailable: (ms: number) => void
  setDeadline: (ts: number | null) => void
  addActivity: (name: string, plannedMs: number) => void
  updateActivity: (id: string, patch: Partial<Pick<Activity, 'name' | 'color' | 'plannedMs'>>) => void
  removeActivity: (id: string) => void
  reorderActivities: (ids: string[]) => void

  // sessão
  activate: (id: string, blockMs?: number) => void
  pauseAll: () => void
  resume: () => void
  tick: (now: number) => ReconcileEvent[]
  endSession: () => void
  resetSession: () => void
  newSession: () => void

  // ajustes de tempo
  adjustTime: (id: string, deltaMs: number) => void
  transferTime: (fromId: string, toId: string, ms: number) => void
  distributeUnallocated: (mode: 'proportional' | { toId: string }) => void

  // desfazer
  undoLastSwitch: () => void
  clearUndo: () => void

  // presets
  savePreset: (name: string) => void
  loadPreset: (id: string) => void
  deletePreset: (id: string) => void
  renamePreset: (id: string, name: string) => void
  duplicatePreset: (id: string) => void

  // histórico
  clearHistory: () => void

  // configurações
  setSettings: (patch: Partial<Settings>) => void
  setTheme: (theme: Theme) => void

  // dados
  exportData: () => string
  importData: (json: string, mode: 'merge' | 'replace') => void
}

function snapshot(session: Session, now: number): UndoSnapshot {
  return { session, createdAt: now }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      screen: 'setup',
      session: makeSession(),
      presets: [],
      history: [],
      settings: defaultSettings,
      undo: null,
      lastSummary: null,
      storageOk: true,

      setScreen: (screen) => set({ screen }),
      startSession: () => set({ screen: 'session' }),

      setAvailable: (ms) =>
        set((s) => ({ session: { ...s.session, availableMs: Math.max(0, ms) } })),
      setDeadline: (ts) => set((s) => ({ session: { ...s.session, deadline: ts } })),

      addActivity: (name, plannedMs) =>
        set((s) => {
          const trimmed = name.trim()
          if (trimmed === '' || plannedMs <= 0) return s
          const color = nextColor(s.session.activities.map((a) => a.color))
          const activity: Activity = {
            id: crypto.randomUUID(),
            name: trimmed,
            color,
            plannedMs,
            usedMs: 0,
          }
          return { session: { ...s.session, activities: [...s.session.activities, activity] } }
        }),

      updateActivity: (id, patch) =>
        set((s) => {
          const activities = s.session.activities.map((a) => {
            if (a.id !== id) return a
            const next = { ...a, ...patch }
            if (patch.name !== undefined) next.name = patch.name.trim() || a.name
            if (patch.plannedMs !== undefined) {
              next.plannedMs = Math.max(patch.plannedMs, a.usedMs)
            }
            return next
          })
          return { session: { ...s.session, activities } }
        }),

      removeActivity: (id) =>
        set((s) => {
          if (s.session.activeId === id) return s // não remove a ativa
          return {
            session: { ...s.session, activities: s.session.activities.filter((a) => a.id !== id) },
          }
        }),

      reorderActivities: (ids) =>
        set((s) => {
          const map = new Map(s.session.activities.map((a) => [a.id, a]))
          const activities = ids.map((id) => map.get(id)).filter((a): a is Activity => !!a)
          // garante que nenhuma atividade suma caso os ids estejam incompletos
          for (const a of s.session.activities) if (!ids.includes(a.id)) activities.push(a)
          return { session: { ...s.session, activities } }
        }),

      activate: (id, blockMs) =>
        set((s) => {
          const now = Date.now()
          const target = s.session.activities.find((a) => a.id === id)
          if (!target) return s
          // toggle: clicar na ativa pausa
          if (s.session.activeId === id && blockMs == null) {
            return { session: pauseSession(s.session, now), undo: snapshot(s.session, now) }
          }
          // atividade zerada não ativa
          if (getRemainingMs(target, s.session, now) <= 0) return s
          return { session: activateSession(s.session, id, now, blockMs), undo: snapshot(s.session, now) }
        }),

      pauseAll: () =>
        set((s) => {
          if (s.session.activeId == null) return s
          const now = Date.now()
          return { session: pauseSession(s.session, now), undo: snapshot(s.session, now) }
        }),

      resume: () =>
        set((s) => {
          const now = Date.now()
          const id = s.session.lastActiveId
          if (id == null) return s
          const target = s.session.activities.find((a) => a.id === id)
          if (!target || getRemainingMs(target, s.session, now) <= 0) return s
          return { session: activateSession(s.session, id, now), undo: snapshot(s.session, now) }
        }),

      tick: (now) => {
        const s = get()
        if (s.session.activeId == null) return []
        const { session, events } = reconcile(s.session, now)
        if (events.length > 0) set({ session })
        return events
      },

      endSession: () =>
        set((s) => {
          const now = Date.now()
          const base = settle(s.session, now)
          const log = closeOpenSegment(base.log, now)
          if (base.startedAt == null) {
            // nunca iniciou de fato: volta ao setup sem registrar histórico
            return { screen: 'setup' as Screen, session: { ...base, log } }
          }
          const entry: HistoryEntry = {
            id: crypto.randomUUID(),
            startedAt: base.startedAt,
            endedAt: now,
            availableMs: base.availableMs,
            pausedMs: base.pausedMs,
            activities: base.activities.map((a) => ({
              id: a.id,
              name: a.name,
              color: a.color,
              plannedMs: a.plannedMs,
              usedMs: a.usedMs,
            })),
            log,
          }
          return {
            session: { ...base, log },
            history: [entry, ...s.history].slice(0, 200),
            lastSummary: entry,
            screen: 'summary' as Screen,
            undo: null,
          }
        }),

      resetSession: () => set({ session: makeSession(), screen: 'setup', undo: null }),

      newSession: () =>
        set((s) => {
          const fresh = makeSession(s.session.availableMs)
          fresh.activities = s.session.activities.map((a) => ({
            id: crypto.randomUUID(),
            name: a.name,
            color: a.color,
            plannedMs: a.plannedMs,
            usedMs: 0,
          }))
          return { session: fresh, screen: 'setup', undo: null, lastSummary: null }
        }),

      adjustTime: (id, deltaMs) =>
        set((s) => {
          const now = Date.now()
          const activities = s.session.activities.map((a) => {
            if (a.id !== id) return a
            const effectiveUsed =
              s.session.activeId === id && s.session.activeSince != null
                ? a.usedMs + Math.max(0, now - s.session.activeSince)
                : a.usedMs
            const planned = Math.max(a.plannedMs + deltaMs, Math.ceil(effectiveUsed))
            return { ...a, plannedMs: planned }
          })
          return { session: { ...s.session, activities } }
        }),

      transferTime: (fromId, toId, ms) =>
        set((s) => {
          if (ms <= 0 || fromId === toId) return s
          const now = Date.now()
          const from = s.session.activities.find((a) => a.id === fromId)
          const to = s.session.activities.find((a) => a.id === toId)
          if (!from || !to) return s
          const available = Math.max(0, getRemainingMs(from, s.session, now))
          const amount = Math.min(ms, available)
          if (amount <= 0) return s
          const activities = s.session.activities.map((a) => {
            if (a.id === fromId) return { ...a, plannedMs: a.plannedMs - amount }
            if (a.id === toId) return { ...a, plannedMs: a.plannedMs + amount }
            return a
          })
          return { session: { ...s.session, activities } }
        }),

      distributeUnallocated: (mode) =>
        set((s) => {
          const allocated = s.session.activities.reduce((sum, a) => sum + a.plannedMs, 0)
          const diff = s.session.availableMs - allocated
          if (diff <= 0 || s.session.activities.length === 0) return s
          let activities: Activity[]
          if (mode === 'proportional') {
            if (allocated <= 0) {
              // sem base proporcional: divide igualmente
              const per = Math.floor(diff / s.session.activities.length)
              activities = s.session.activities.map((a) => ({ ...a, plannedMs: a.plannedMs + per }))
            } else {
              activities = s.session.activities.map((a) => ({
                ...a,
                plannedMs: a.plannedMs + Math.round((a.plannedMs / allocated) * diff),
              }))
            }
          } else {
            activities = s.session.activities.map((a) =>
              a.id === mode.toId ? { ...a, plannedMs: a.plannedMs + diff } : a,
            )
          }
          return { session: { ...s.session, activities } }
        }),

      undoLastSwitch: () =>
        set((s) => {
          if (!s.undo) return s
          if (Date.now() - s.undo.createdAt > UNDO_TTL) return { undo: null }
          return { session: s.undo.session, undo: null }
        }),

      clearUndo: () => set({ undo: null }),

      savePreset: (name) =>
        set((s) => {
          const trimmed = name.trim()
          if (trimmed === '') return s
          const preset: Preset = {
            id: crypto.randomUUID(),
            name: trimmed,
            availableMs: s.session.availableMs || null,
            activities: s.session.activities.map((a) => ({
              name: a.name,
              color: a.color,
              plannedMs: a.plannedMs,
            })),
            createdAt: Date.now(),
          }
          return { presets: [preset, ...s.presets] }
        }),

      loadPreset: (id) =>
        set((s) => {
          const preset = s.presets.find((p) => p.id === id)
          if (!preset) return s
          const fresh = makeSession(preset.availableMs ?? s.session.availableMs)
          fresh.deadline = s.session.deadline
          fresh.activities = preset.activities.map((a) => ({
            id: crypto.randomUUID(),
            name: a.name,
            color: a.color,
            plannedMs: a.plannedMs,
            usedMs: 0,
          }))
          return { session: fresh }
        }),

      deletePreset: (id) => set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),

      renamePreset: (id, name) =>
        set((s) => ({
          presets: s.presets.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)),
        })),

      duplicatePreset: (id) =>
        set((s) => {
          const preset = s.presets.find((p) => p.id === id)
          if (!preset) return s
          const copy: Preset = {
            ...preset,
            id: crypto.randomUUID(),
            name: `${preset.name} (cópia)`,
            activities: preset.activities.map((a) => ({ ...a })),
            createdAt: Date.now(),
          }
          return { presets: [copy, ...s.presets] }
        }),

      clearHistory: () => set({ history: [] }),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),

      exportData: () => {
        const s = get()
        return JSON.stringify(
          buildExport({ presets: s.presets, history: s.history, settings: s.settings }),
          null,
          2,
        )
      },

      importData: (json, mode) =>
        set((s) => {
          const parsed = parseImport(json)
          if (mode === 'replace') {
            return {
              presets: parsed.presets,
              history: parsed.history.slice(0, 200),
              settings: { ...defaultSettings, ...parsed.settings },
            }
          }
          return {
            presets: [...parsed.presets, ...s.presets],
            history: [...parsed.history, ...s.history].slice(0, 200),
            settings: { ...s.settings, ...parsed.settings },
          }
        }),
    }),
    {
      name: 'ampulhetas',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        screen: state.screen,
        session: state.session,
        presets: state.presets,
        history: state.history,
        settings: state.settings,
        lastSummary: state.lastSummary,
      }),
      migrate: (persisted) => persisted as AppState,
      onRehydrateStorage: () => (state) => {
        if (state) state.storageOk = isStorageHealthy()
      },
    },
  ),
)
