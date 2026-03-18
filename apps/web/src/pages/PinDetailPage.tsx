import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  Heart, Bookmark, Share2, Download, Repeat2, Flag,
  Lock, Tag, Bot, ShieldCheck, MoreHorizontal, Link2
} from 'lucide-react'
import { apiGet } from '@/lib/api'
import type { Pin } from '@/types'
import { formatNumber, formatPrice, formatDate } from '@/utils/format'
import MediaPlayer from '@/components/pins/MediaPlayer'
import ProtectedOverlay from '@/components/dam/ProtectedOverlay'
import DownloadModal from '@/components/dam/DownloadModal'
import MasonryFeed from '@/components/feed/MasonryFeed'
import PinCardSkeleton from '@/components/pins/PinCardSkeleton'
import { useState } from 'react'
import { usePinActions } from '@/hooks/usePinActions'
import { useAuthStore } from '@/store/authStore'
import ReportModal from '@/components/moderation/ReportModal'
import SaveToCollectionModal from '@/components/pins/SaveToCollectionModal'
import CommentSection from '@/components/pins/CommentSection'
import FollowButton from '@/components/profile/FollowButton'

export default function PinDetailPage() {
  const { pinId } = useParams<{ pinId: string }>()
  const { user } = useAuthStore()
  const [showDownload, setShowDownload] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)

  const { data: pin, isLoading } = useQuery({
    queryKey: ['pin', pinId],
    queryFn: () => apiGet<Pin>(`/pins/${pinId}`),
    enabled: !!pinId,
  })

  const { data: moreLikeThis } = useQuery({
    queryKey: ['pin-related', pinId],
    queryFn: () => apiGet<Pin[]>(`/pins/${pinId}/related`),
    enabled: !!pinId,
  })

  const { toggleLike, repost, share } = usePinActions(pinId!)

  if (isLoading || !pin) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_360px] gap-8">
        <div className="shimmer-loading rounded-3xl" style={{ minHeight: 400 }} />
        <div className="flex flex-col gap-4">
          {[80, 60, 40, 40, 80].map((w, i) => (
            <div key={i} className="shimmer-loading rounded-xl" style={{ height: 32, width: `${w}%` }} />
          ))}
        </div>
      </div>
    )
  }

  const isProtected = pin.isProtected || pin.screenshotProtection
  const aspectStyle = { aspectRatio: `${pin.originalWidth} / ${pin.originalHeight}` }
  const isOwnPin = user?.id === pin.creator.id
  const savings =
    pin.originalPrice && pin.salePrice
      ? Math.round(((pin.originalPrice - pin.salePrice) / pin.originalPrice) * 100)
      : 0

  return (
    <>
      <Helmet>
        <title>{pin.title} — Virens</title>
        <meta name="description" content={pin.description || `A pin by ${pin.creator.displayName} on Virens.`} />
        <meta property="og:title" content={pin.title} />
        <meta property="og:image" content={pin.thumbnailUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={pin.thumbnailUrl} />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8 pb-24 lg:pb-8">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Media panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl bg-virens-gray"
            onContextMenu={isProtected ? (e) => e.preventDefault() : undefined}
          >
            <div style={aspectStyle} className="relative max-h-[85vh]">
              <MediaPlayer
                url={pin.mediaUrl}
                thumbnailUrl={pin.thumbnailUrl}
                type={pin.mediaType}
                alt={pin.title}
                isProtected={isProtected}
                controls
              />
              {isProtected && (
                <ProtectedOverlay watermark={pin.hasVisibleWatermark ? pin.creator.username : undefined} />
              )}
            </div>

            {/* Resolution info */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <span className="badge-gray text-[10px]">
                {pin.originalWidth} × {pin.originalHeight}px
              </span>
              <span className="badge-gray text-[10px] uppercase">{pin.mediaType}</span>
            </div>
          </motion.div>

          {/* Info panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-5"
          >
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              {pin.contentType === 'ai_generated' && (
                <span className="badge bg-virens-info/15 text-virens-info border border-virens-info/20 text-xs">
                  <Bot size={11} /> AI Generated
                </span>
              )}
              {pin.isProtected && (
                <span className="badge bg-virens-warning/15 text-virens-warning border border-virens-warning/20 text-xs">
                  <Lock size={11} /> Protected
                </span>
              )}
              {pin.isSensitive && (
                <span className="badge bg-red-500/15 text-red-400 border border-red-500/20 text-xs">
                  Sensitive
                </span>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="font-display font-bold text-2xl text-virens-white leading-tight">
                {pin.title}
              </h1>
              {pin.description && (
                <p className="text-virens-white-muted text-sm mt-2 leading-relaxed">
                  {pin.description}
                </p>
              )}
            </div>

            {/* Creator */}
            <Link
              to={`/${pin.creator.username}`}
              className="flex items-center gap-3 p-3 glass-card hover:border-virens-green/20 transition-colors"
            >
              {pin.creator.avatar ? (
                <img
                  src={pin.creator.avatar}
                  alt={pin.creator.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-virens-green/20" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-virens-white text-sm truncate">
                    {pin.creator.displayName}
                  </span>
                  {pin.creator.isVerified && (
                    <span className="verified-badge flex-shrink-0">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4l1.8 1.8L6.5 2.5" stroke="#191414" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </span>
                  )}
                </div>
                <span className="text-xs text-virens-white-muted">@{pin.creator.username}</span>
              </div>
              {!isOwnPin && <FollowButton username={pin.creator.username} size="sm" />}
            </Link>

            {/* Engagement stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Likes', value: pin.likesCount },
                { label: 'Saves', value: pin.savesCount },
                { label: 'Reposts', value: pin.repostsCount },
                { label: 'Views', value: pin.viewsCount },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-2 glass rounded-xl">
                  <p className="font-display font-bold text-virens-white text-base">
                    {formatNumber(value)}
                  </p>
                  <p className="text-[10px] text-virens-white-muted">{label}</p>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLike}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border
                  ${pin.isLiked
                    ? 'bg-red-500/12 text-red-400 border-red-500/20'
                    : 'glass text-virens-white-muted border-white/8 hover:border-white/15'
                  }`}
              >
                <Heart size={15} fill={pin.isLiked ? 'currentColor' : 'none'} />
                {formatNumber(pin.likesCount)}
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border
                  ${pin.isSaved
                    ? 'bg-virens-green/12 text-virens-green border-virens-green/20'
                    : 'glass text-virens-white-muted border-white/8 hover:border-white/15'
                  }`}
              >
                <Bookmark size={15} fill={pin.isSaved ? 'currentColor' : 'none'} />
                Save
              </button>
              <button
                onClick={repost}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all border
                  ${pin.isReposted
                    ? 'bg-virens-info/12 text-virens-info border-virens-info/20'
                    : 'glass text-virens-white-muted border-white/8 hover:border-white/15'
                  }`}
              >
                <Repeat2 size={16} />
              </button>
              <button
                onClick={share}
                className="flex items-center justify-center w-10 h-10 glass rounded-xl text-virens-white-muted border border-white/8 hover:border-white/15 transition-all"
              >
                <Share2 size={16} />
              </button>
            </div>

            {/* Price / Download */}
            {pin.isForSale && (
              <div className="p-4 glass-card border-virens-green/10">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    {savings > 0 && (
                      <p className="price-original">{formatPrice(pin.originalPrice!, pin.currency)}</p>
                    )}
                    <p className="price-sale text-xl">
                      {formatPrice(pin.salePrice || pin.originalPrice!, pin.currency)}
                    </p>
                  </div>
                  {savings > 0 && (
                    <span className="badge-green text-xs">Save {savings}%</span>
                  )}
                </div>
                <button className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                  <Tag size={14} />
                  Purchase Asset
                </button>
              </div>
            )}

            {/* Download section */}
            {pin.downloadPermission !== 'none' && (
              <button
                onClick={() => setShowDownload(true)}
                className="btn-secondary flex items-center justify-center gap-2 text-sm"
              >
                <Download size={15} />
                Download
                {pin.downloadPermission === 'subscribers_only' && (
                  <span className="badge-gray text-[10px] ml-1">Subscribers</span>
                )}
              </button>
            )}

            {/* Tags */}
            {pin.tags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-virens-white-muted uppercase tracking-wider mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {pin.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/search?q=${encodeURIComponent(tag)}&type=tag`}
                      className="tag-chip text-xs"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center justify-between text-xs text-virens-white-muted border-t border-white/6 pt-4">
              <span>{formatDate(pin.createdAt)}</span>
              <button
                onClick={() => setShowReport(true)}
                className="flex items-center gap-1 hover:text-virens-error transition-colors"
              >
                <Flag size={11} />
                Report
              </button>
            </div>
          </motion.div>
        </div>

        {/* Comments */}
        <div className="mt-8 lg:col-span-2">
          <CommentSection pinId={pin.id} />
        </div>

        {/* More Like This */}
        {moreLikeThis && moreLikeThis.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="divider-green" />
              <h2 className="font-display font-bold text-xl text-virens-white">More Like This</h2>
            </div>
            <MasonryFeed pins={moreLikeThis} showAds={false} />
          </div>
        )}
      </div>

      {showDownload && <DownloadModal pin={pin} onClose={() => setShowDownload(false)} />}
            {showSaveModal && (
        <SaveToCollectionModal pinId={pin.id} onClose={() => setShowSaveModal(false)} />
      )}
      {showReport && (
        <ReportModal
          targetType="pin"
          targetId={pin.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  )
}
