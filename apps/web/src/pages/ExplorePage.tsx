import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { apiGet } from '@/lib/api'
import type { Pin, PaginatedResponse } from '@/types'
import MasonryFeed from '@/components/feed/MasonryFeed'
import TagStrip from '@/components/feed/TagStrip'
import { useState } from 'react'

export default function ExplorePage() {
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useQuery({
    queryKey: ['explore', activeTag],
    queryFn: () => apiGet<PaginatedResponse<Pin>>('/pins/explore', { tag: activeTag, page: 1 }),
  }) as any

  return (
    <>
      <Helmet>
        <title>Explore — Virens</title>
        <meta name="description" content="Explore trending visual content from creators worldwide on Virens." />
      </Helmet>
      <div className="px-4 lg:px-6 py-6 pb-24 lg:pb-6">
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl text-virens-white">Explore</h1>
          <p className="text-sm text-virens-white-muted mt-1">Discover trending visual content</p>
        </div>
        <TagStrip activeTag={activeTag} onSelect={setActiveTag} />
        <motion.div key={activeTag} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
          <MasonryFeed
            pins={data?.items ?? []}
            isLoading={isLoading}
            isFetchingMore={isFetchingNextPage}
            hasMore={hasNextPage}
            onLoadMore={fetchNextPage}
          />
        </motion.div>
      </div>
    </>
  )
}
