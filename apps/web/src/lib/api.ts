import axios from 'axios'
import toast from 'react-hot-toast'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true, // for httpOnly cookie refresh tokens
  timeout: 30000,
})

// Request interceptor — auth token is set by authStore
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401, network errors
let isRefreshing = false
let failedQueue: Array<{ resolve: Function; reject: Function }> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await api.post('/auth/refresh')
        const { access_token } = res.data
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        processQueue(null, access_token)
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        // Redirect to login if refresh fails
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    // Show toast for server errors
    if (error.response?.status >= 500) {
      toast.error('Something went wrong. Please try again.')
    }

    return Promise.reject(error)
  }
)

// Typed helpers
export const apiGet = <T>(url: string, params?: Record<string, unknown>) =>
  api.get<T>(url, { params }).then((r) => r.data)

export const apiPost = <T>(url: string, data?: unknown) =>
  api.post<T>(url, data).then((r) => r.data)

export const apiPut = <T>(url: string, data?: unknown) =>
  api.put<T>(url, data).then((r) => r.data)

export const apiPatch = <T>(url: string, data?: unknown) =>
  api.patch<T>(url, data).then((r) => r.data)

export const apiDelete = <T>(url: string) =>
  api.delete<T>(url).then((r) => r.data)

export const apiUpload = <T>(url: string, formData: FormData, onProgress?: (pct: number) => void) =>
  api.post<T>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  }).then((r) => r.data)
