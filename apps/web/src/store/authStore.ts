import { create } from 'zustand'
import type { User } from '@/types'
import { api } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean   // ← new

  initialize: () => Promise<void>   // ← new
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  setToken: (token: string) => void
}

interface RegisterData {
  username: string
  email: string
  password: string
  displayName: string
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,   // ← new

  // ─── Called once on app mount ───────────────────────────────────────────────
  initialize: async () => {
    try {
      // The httpOnly refresh_token cookie is sent automatically (withCredentials)
      const { data: { access_token } } = await api.post('/auth/refresh')
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      const { data: user } = await api.get('/auth/me')
      set({ token: access_token, user, isAuthenticated: true })
    } catch {
      // No valid session — stay logged out, that's fine
    } finally {
      set({ isInitialized: true })
    }
  },

  setToken: (token) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    set({ token, isAuthenticated: true })
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data: { access_token, user } } = await api.post('/auth/login', { email, password })
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      set({ token: access_token, user, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (data) => {
    set({ isLoading: true })
    try {
      const { data: { access_token, user } } = await api.post('/auth/register', data)
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      set({ token: access_token, user, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    try { await api.post('/auth/logout') } catch { /* best-effort */ }
    delete api.defaults.headers.common['Authorization']
    set({ user: null, token: null, isAuthenticated: false })
  },

  refreshUser: async () => {
    if (!get().token) return
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data })
    } catch {
      get().logout()
    }
  },
}))