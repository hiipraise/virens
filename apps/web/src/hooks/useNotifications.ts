import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'
import type { Notification, PaginatedResponse } from '@/types'
import { useAuthStore } from '@/store/authStore'

export function useNotifications() {
  const { isAuthenticated } = useAuthStore()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiGet<PaginatedResponse<Notification> & { unread: number }>('/notifications'),
    enabled: isAuthenticated,
    refetchInterval: 30000, // poll every 30s
  })

  const markAllRead = useMutation({
    mutationFn: () => apiPost('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return {
    notifications: data?.items ?? [],
    unreadCount: data?.unread ?? 0,
    total: data?.total ?? 0,
    isLoading,
    markAllRead: markAllRead.mutate,
  }
}
