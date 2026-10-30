export type Activity = {
  id: string
  name: string
  color: string // cor da paleta (ver colors.ts)
  plannedMs: number // duração planejada
  usedMs: number // tempo consolidado
}

export type Segment = {
  activityId: string | null // null = pausa
  start: number
  end: number | null // null = segmento em andamento
}

export type Session = {
  id: string
  availableMs: number
  deadline: number | null // hora limite opcional (timestamp)
  activities: Activity[]
  activeId: string | null // null = pausado / não iniciado
  activeSince: number | null
  lastActiveId: string | null // para o "Retomar"
  blockEndsAt: number | null // mini-timer de bloco
  startedAt: number | null // primeira ativação
  pausedMs: number // total consolidado de pausa
  pausedSince: number | null
  log: Segment[]
}

export type Preset = {
  id: string
  name: string
  availableMs: number | null
  activities: { name: string; color: string; plannedMs: number }[]
  createdAt: number
}

export type HistoryEntry = {
  id: string
  startedAt: number
  endedAt: number
  availableMs: number
  pausedMs: number
  // inclui `id` para resolver nomes na linha do tempo gerada a partir do log
  activities: { id: string; name: string; color: string; plannedMs: number; usedMs: number }[]
  log: Segment[]
}

export type Theme = 'dark' | 'light' | 'system'

export type Settings = {
  soundEnabled: boolean
  soundVolume: number // 0 a 1
  notificationsEnabled: boolean
  theme: Theme
  dynamicFavicon: boolean
}

export type UndoSnapshot = {
  session: Session // estado da sessão antes da troca
  createdAt: number
}

export type ReconcileEvent =
  | { type: 'activity-finished'; activityId: string; at: number }
  | { type: 'block-finished'; activityId: string; at: number }
