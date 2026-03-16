import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { apiGet } from '@/lib/api'
import type { Collection, Pin, PaginatedResponse } from '@/types'
import MasonryFeed from '@/components/feed/MasonryFeed'

export default function CollectionDetailPage() {
  const { username, collectionId } = useParams<{ username: string; collectionId: string }>()

  const { data: collection } = useQuery({
    queryKey: ['collection', collectionId],
    queryFn: () => apiGet<Collection>(`/collections/${collectionId}`),
    enabled: !!collectionId,
  })

  const { data: pins, isLoading } = useQuery({
    queryKey: ['collection-pins', collectionId],
    queryFn: () => apiGet<PaginatedResponse<Pin>>(`/collections/${collectionId}/pins`),
    enabled: !!collectionId,
  })

  return (
    <>
      <Helmet>
        <title>{collection?.name || 'Collection'} — Virens</title>
        <meta name="description" content={collection?.description || `A collection by ${username}`} />
        {collection?.coverImageUrl && <meta property="og:image" content={collection.coverImageUrl} />}
      </Helmet>
      <div className="px-4 lg:px-6 py-6 pb-24 lg:pb-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl text-virens-white">{collection?.name}</h1>
          {collection?.description && (
            <p className="text-sm text-virens-white-muted mt-1">{collection.description}</p>
          )}
          <p className="text-xs text-virens-white-muted mt-2">{collection?.pinsCount || 0} pins</p>
        </div>
        <MasonryFeed pins={pins?.items ?? []} isLoading={isLoading} showAds={false} emptyMessage="No pins in this collection yet." />
      </div>
    </>
  )
}
