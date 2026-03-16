import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import type { Pin, PaginatedResponse } from '@/types'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function useSearch(query: string, type: string = 'all') {
  const debouncedQuery = useDebounce(query, 300)

  const results = useQuery({
    queryKey: ['search', debouncedQuery, type],
    queryFn: () =>
      apiGet<PaginatedResponse<Pin>>('/search', { q: debouncedQuery, type }),
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 1000 * 30,
  })

  return {
    ...results,
    debouncedQuery,
    isEmpty: !debouncedQuery.trim(),
  }
}
