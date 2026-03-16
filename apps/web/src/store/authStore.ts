import { create } from 'zustand'
import type { User } from '@/types'
import { api } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

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

// NOTE: No localStorage is used. Tokens are stored in memory only.
// For persistence across page loads, use httpOnly cookies via the backend.
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  setToken: (token: string) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    set({ token, isAuthenticated: true })
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const res = await api.post('/auth/login', { email, password })
      const { access_token, user } = res.data
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      set({ token: access_token, user, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (data) => {
    set({ isLoading: true })
    try {
      const res = await api.post('/auth/register', data)
      const { access_token, user } = res.data
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      set({ token: access_token, user, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    delete api.defaults.headers.common['Authorization']
    set({ user: null, token: null, isAuthenticated: false })
  },

  refreshUser: async () => {
    const { token } = get()
    if (!token) return
    try {
      const res = await api.get('/auth/me')
      set({ user: res.data })
    } catch {
      get().logout()
    }
  },
}))
