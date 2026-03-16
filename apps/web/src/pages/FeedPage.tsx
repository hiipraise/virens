import { useInfiniteQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Clock } from 'lucide-react'
import { useState } from 'react'
import { apiGet } from '@/lib/api'
import type { Pin, PaginatedResponse } from '@/types'
import { useFeedStore } from '@/store/feedStore'
import { useAuthStore } from '@/store/authStore'
import MasonryFeed from '@/components/feed/MasonryFeed'
import TagStrip from '@/components/feed/TagStrip'

type FeedTab = 'personalized' | 'trending' | 'latest'

const TABS: { id: FeedTab; label: string; icon: React.ElementType }[] = [
  { id: 'personalized', label: 'For You', icon: Sparkles },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'latest', label: 'Latest', icon: Clock },
]

export default function FeedPage() {
  const { showSensitiveContent, showAIContent } = useFeedStore()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<FeedTab>('personalized')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['feed', activeTab, activeTag, showSensitiveContent, showAIContent],
    queryFn: ({ pageParam = 1 }) =>
      apiGet<PaginatedResponse<Pin>>('/feed', {
        mode: activeTab,
        page: pageParam,
        page_size: 24,
        tag: activeTag,
        show_sensitive: showSensitiveContent,
        show_ai: showAIContent,
      }),
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    initialPageParam: 1,
  })

  const pins = data?.pages.flatMap((p) => p.items) ?? []

  return (
    <>
      <Helmet>
        <title>Virens — Visual Discovery for Creators</title>
        <meta name="description" content="Discover and share stunning visual content. Virens is the creator-first visual platform." />
      </Helmet>

      <div className="px-4 lg:px-6 py-6 pb-24 lg:pb-6">
        {/* Header */}
        <div className="mb-6">
          {user ? (
            <div className="flex items-center gap-3 mb-5">
              <div>
                <h1 className="font-display font-bold text-2xl text-virens-white">
                  Hey, {user.displayName.split(' ')[0]}
                </h1>
                <p className="text-sm text-virens-white-muted mt-0.5">
                  Here's what's happening in your world
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-5">
              <h1 className="font-display font-bold text-3xl text-virens-white">
                Visual discovery,{' '}
                <span className="text-virens-green">reimagined.</span>
              </h1>
              <p className="text-virens-white-muted mt-2">
                Explore millions of images, videos, and GIFs by creators who care.
              </p>
            </div>
          )}

          {/* Feed tabs */}
          <div className="flex items-center gap-1 p-1 glass rounded-2xl w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  ${activeTab === id
                    ? 'bg-virens-green text-virens-black shadow-green-glow'
                    : 'text-virens-white-muted hover:text-virens-white'
                  }
                `}
              >
                <Icon size={14} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tag filter strip */}
        <TagStrip activeTag={activeTag} onSelect={setActiveTag} />

        {/* Feed */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-4"
        >
          <MasonryFeed
            pins={pins}
            isLoading={isLoading}
            isFetchingMore={isFetchingNextPage}
            hasMore={hasNextPage}
            onLoadMore={fetchNextPage}
            showAds={user?.subscriptionTier === 'none' || !user}
            emptyMessage="No pins to show. Follow some creators to get started."
          />
        </motion.div>
      </div>
    </>
  )
}
