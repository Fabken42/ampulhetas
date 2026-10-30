import { create } from 'zustand'

export type Panel = 'history' | 'presets' | 'settings' | 'shortcuts' | null

type UiState = {
  // modais por atividade
  blockPickerFor: string | null
  transferFrom: string | null
  editFor: string | null
  // painéis globais
  panel: Panel
  // modal de adicionar atividade na sessão
  addOpen: boolean

  openBlockPicker: (id: string) => void
  closeBlockPicker: () => void
  openTransfer: (id: string) => void
  closeTransfer: () => void
  openEdit: (id: string) => void
  closeEdit: () => void
  openPanel: (panel: Panel) => void
  closePanel: () => void
  setAddOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  blockPickerFor: null,
  transferFrom: null,
  editFor: null,
  panel: null,
  addOpen: false,

  openBlockPicker: (id) => set({ blockPickerFor: id }),
  closeBlockPicker: () => set({ blockPickerFor: null }),
  openTransfer: (id) => set({ transferFrom: id }),
  closeTransfer: () => set({ transferFrom: null }),
  openEdit: (id) => set({ editFor: id }),
  closeEdit: () => set({ editFor: null }),
  openPanel: (panel) => set({ panel }),
  closePanel: () => set({ panel: null }),
  setAddOpen: (open) => set({ addOpen: open }),
}))
