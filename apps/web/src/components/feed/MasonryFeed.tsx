import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Masonry from 'react-masonry-css'
import type { Pin } from '@/types'
import PinCard from '@/components/pins/PinCard'
import PinCardSkeleton from '@/components/pins/PinCardSkeleton'
import { useInView } from 'react-intersection-observer'
import AdCard from '@/components/ads/AdCard'

interface MasonryFeedProps {
  pins: Pin[]
  isLoading?: boolean
  isFetchingMore?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  showAds?: boolean
  emptyMessage?: string
}

const BREAKPOINTS = {
  default: 5,
  1536: 5,
  1280: 4,
  1024: 3,
  768: 2,
  640: 2,
}

// Inject a platform ad every N pins
const AD_EVERY = 12

export default function MasonryFeed({
  pins,
  isLoading,
  isFetchingMore,
  hasMore,
  onLoadMore,
  showAds = true,
  emptyMessage = 'No pins found',
}: MasonryFeedProps) {
  const { ref: bottomRef, inView } = useInView({ threshold: 0.3, rootMargin: '200px' })

  useEffect(() => {
    if (inView && hasMore && !isFetchingMore && onLoadMore) {
      onLoadMore()
    }
  }, [inView, hasMore, isFetchingMore, onLoadMore])

  if (isLoading) {
    return (
      <Masonry breakpointCols={BREAKPOINTS} className="masonry-grid" columnClassName="masonry-col">
        {Array.from({ length: 12 }).map((_, i) => (
          <PinCardSkeleton key={i} />
        ))}
      </Masonry>
    )
  }

  if (!pins.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-virens-white-muted">
        <div className="w-16 h-16 rounded-2xl bg-white/4 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="6" y="6" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 14h20M14 6v20" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <p className="font-display font-semibold text-lg">{emptyMessage}</p>
      </div>
    )
  }

  // Weave ads into the pin list
  const items: Array<{ type: 'pin'; pin: Pin } | { type: 'ad'; index: number }> = []
  pins.forEach((pin, i) => {
    items.push({ type: 'pin', pin })
    if (showAds && (i + 1) % AD_EVERY === 0) {
      items.push({ type: 'ad', index: i })
    }
  })

  return (
    <div>
      <Masonry
        breakpointCols={BREAKPOINTS}
        className="masonry-grid"
        columnClassName="masonry-col"
      >
        {items.map((item, i) =>
          item.type === 'pin' ? (
            <PinCard key={item.pin.id} pin={item.pin} />
          ) : (
            <AdCard key={`ad-${item.index}`} />
          )
        )}
      </Masonry>

      {/* Load more sentinel */}
      <div ref={bottomRef} className="h-8 flex items-center justify-center">
        {isFetchingMore && (
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-virens-green/60"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
