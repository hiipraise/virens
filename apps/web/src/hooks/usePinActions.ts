import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost, apiDelete } from '@/lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

export function usePinActions(pinId: string) {
  const qc = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const requireAuth = () => {
    if (!isAuthenticated) { toast.error('Sign in to do that'); return false }
    return true
  }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['pin', pinId] })
    qc.invalidateQueries({ queryKey: ['feed'] })
  }

  const likeMut = useMutation({
    mutationFn: () => apiPost(`/pins/${pinId}/like`),
    onSuccess: invalidate,
    onError: () => toast.error('Could not update like'),
  })

  const saveMut = useMutation({
    mutationFn: () => apiPost(`/pins/${pinId}/save`),
    onSuccess: invalidate,
    onError: () => toast.error('Could not save pin'),
  })

  const repostMut = useMutation({
    mutationFn: () => apiPost(`/pins/${pinId}/repost`),
    onSuccess: () => { invalidate(); toast.success('Reposted') },
    onError: () => toast.error('Could not repost'),
  })

  const downloadMut = useMutation({
    mutationFn: () => apiPost<{ download_url: string }>(`/pins/${pinId}/download`),
    onSuccess: (data) => {
      const a = document.createElement('a')
      a.href = data.download_url
      a.download = ''
      a.click()
    },
    onError: () => toast.error('Download failed'),
  })

  return {
    toggleLike: () => requireAuth() && likeMut.mutate(),
    toggleSave: () => requireAuth() && saveMut.mutate(),
    repost: () => requireAuth() && repostMut.mutate(),
    download: () => requireAuth() && downloadMut.mutate(),
  }
}
