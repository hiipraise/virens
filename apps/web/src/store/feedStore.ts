import { create } from 'zustand'

interface FeedState {
  showSensitiveContent: boolean
  showAIContent: boolean
  feedLayout: 'masonry' | 'grid' | 'list'
  sidebarOpen: boolean
  activeModal: string | null
  modalData: Record<string, unknown>

  toggleSensitiveContent: () => void
  toggleAIContent: () => void
  setFeedLayout: (layout: 'masonry' | 'grid' | 'list') => void
  toggleSidebar: () => void
  openModal: (name: string, data?: Record<string, unknown>) => void
  closeModal: () => void
}

export const useFeedStore = create<FeedState>((set) => ({
  showSensitiveContent: false,
  showAIContent: true,
  feedLayout: 'masonry',
  sidebarOpen: true,
  activeModal: null,
  modalData: {},

  toggleSensitiveContent: () =>
    set((s) => ({ showSensitiveContent: !s.showSensitiveContent })),

  toggleAIContent: () =>
    set((s) => ({ showAIContent: !s.showAIContent })),

  setFeedLayout: (layout) => set({ feedLayout: layout }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  openModal: (name, data = {}) => set({ activeModal: name, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: {} }),
}))
