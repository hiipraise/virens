import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import type { User, Pin, PaginatedResponse } from '@/types'

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => apiGet<User>(`/users/${username}`),
    enabled: !!username,
    staleTime: 1000 * 60 * 5,
  })
}

export function useProfilePins(
  username: string,
  tab: 'pins' | 'liked' | 'reposts' | 'collections' = 'pins',
  page = 1
) {
  return useQuery({
    queryKey: ['profile-pins', username, tab, page],
    queryFn: () =>
      apiGet<PaginatedResponse<Pin>>(`/users/${username}/pins`, { tab, page, page_size: 24 }),
    enabled: !!username,
  })
}
