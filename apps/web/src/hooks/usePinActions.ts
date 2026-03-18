import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiPost } from '@/lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

export function usePinActions(pinId: string) {
  const qc = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const requireAuth = () => {
    if (!isAuthenticated) {
      toast.error('Sign in to do that')
      return false
    }
    return true
  }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['pin', pinId] })
    qc.invalidateQueries({ queryKey: ['feed'] })
    qc.invalidateQueries({ queryKey: ['profile-pins'] })
    qc.invalidateQueries({ queryKey: ['collection-pins'] })
    qc.invalidateQueries({ queryKey: ['collections'] })
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
    onSuccess: () => {
      invalidate()
      toast.success('Reposted')
    },
    onError: () => toast.error('Could not repost'),
  })

  const shareMut = useMutation({
    mutationFn: () => apiPost<{ shareUrl: string }>(`/pins/${pinId}/share`),
    onSuccess: async (data) => {
      const shareUrl = new URL(data.shareUrl, window.location.origin).toString()
      if (navigator.share) {
        await navigator.share({ url: shareUrl })
      } else {
        await navigator.clipboard.writeText(shareUrl)
      }
      invalidate()
      toast.success('Share link ready')
    },
    onError: () => toast.error('Could not share pin'),
  })

  const downloadMut = useMutation({
    mutationFn: async () => {
      const response = await api.get(`/pins/${pinId}/download/file`, {
        responseType: 'blob',
      })
      return response.data as Blob
    },
    onSuccess: (blob) => {
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `virens-${pinId}`
      link.click()
      URL.revokeObjectURL(objectUrl)
    },
    onError: () => toast.error('Download failed'),
  })

  return {
    toggleLike: () => requireAuth() && likeMut.mutate(),
    toggleSave: () => requireAuth() && saveMut.mutate(),
    repost: () => requireAuth() && repostMut.mutate(),
    share: () => requireAuth() && shareMut.mutate(),
    download: () => requireAuth() && downloadMut.mutate(),
  }
}
