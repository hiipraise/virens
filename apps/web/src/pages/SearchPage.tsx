// Search Page
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { apiGet } from '@/lib/api'
import type { Pin, PaginatedResponse } from '@/types'
import MasonryFeed from '@/components/feed/MasonryFeed'
import { Search } from 'lucide-react'

export default function SearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const type = params.get('type') || 'all'

  const { data, isLoading } = useQuery({
    queryKey: ['search', q, type],
    queryFn: () => apiGet<PaginatedResponse<Pin>>('/search', { q, type, page: 1 }),
    enabled: q.length > 0,
  })

  return (
    <>
      <Helmet>
        <title>{q ? `"${q}" — Search` : 'Search'} — Virens</title>
        <meta name="description" content={`Search results for ${q} on Virens.`} />
      </Helmet>
      <div className="px-4 lg:px-6 py-6 pb-24 lg:pb-6">
        <div className="mb-6">
          <h1 className="font-display font-bold text-xl text-virens-white">
            {q ? <>Results for <span className="text-virens-green">"{q}"</span></> : 'Search'}
          </h1>
          {data && (
            <p className="text-sm text-virens-white-muted mt-1">{data.total.toLocaleString()} results</p>
          )}
        </div>
        {q ? (
          <MasonryFeed
            pins={data?.items ?? []}
            isLoading={isLoading}
            emptyMessage={`No results for "${q}"`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-virens-white-muted gap-3">
            <Search size={40} strokeWidth={1.2} />
            <p className="font-display font-semibold text-lg">What are you looking for?</p>
          </div>
        )}
      </div>
    </>
  )
}
