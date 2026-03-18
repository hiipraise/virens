import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'
import type { Collection } from '@/types'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export function useCollections(username: string) {
  return useQuery({
    queryKey: ['collections', username],
    queryFn: () => apiGet<Collection[]>(`/users/${username}/collections`),
    enabled: !!username,
  })
}

export function useCreateCollection() {
  const qc = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: (data: { name: string; description?: string; isPrivate?: boolean }) =>
      apiPost<Collection>('/collections', data),
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: ['collections', user.username] })
      toast.success('Collection created')
    },
    onError: () => toast.error('Could not create collection'),
  })
}

export function useSaveToCollection() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ collectionId, pinId }: { collectionId: string; pinId: string }) =>
      apiPost(`/collections/${collectionId}/pins/${pinId}`),
    onSuccess: (_, { collectionId }) => {
      qc.invalidateQueries({ queryKey: ['collections'] })
      qc.invalidateQueries({ queryKey: ['collection', collectionId] })
      qc.invalidateQueries({ queryKey: ['collection-pins', collectionId] })
      qc.invalidateQueries({ queryKey: ['profile-pins'] })
      qc.invalidateQueries({ queryKey: ['pin'] })
      toast.success('Saved to collection')
    },
    onError: () => toast.error('Could not save to collection'),
  })
}
