import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Globe, Lock, Flag } from 'lucide-react'
import { apiGet } from '@/lib/api'
import type { User, Pin, Collection, PaginatedResponse } from '@/types'
import { formatNumber } from '@/utils/format'
import { useAuthStore } from '@/store/authStore'
import MasonryFeed from '@/components/feed/MasonryFeed'
import ReportModal from '@/components/moderation/ReportModal'
import FollowButton from '@/components/profile/FollowButton'
import EditProfileModal from '@/components/profile/EditProfileModal'
import PinnedMedia from '@/components/profile/PinnedMedia'

type ProfileTab = 'pins' | 'liked' | 'reposts' | 'collections'

const TABS: { id: ProfileTab; label: string }[] = [
  { id: 'pins', label: 'Pins' },
  { id: 'liked', label: 'Liked' },
  { id: 'reposts', label: 'Reposts' },
  { id: 'collections', label: 'Collections' },
]

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<ProfileTab>('pins')
  const [showReport, setShowReport] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => apiGet<User>(`/users/${username}`),
    enabled: !!username,
  })

  const { data: pinsData, isLoading: pinsLoading } = useQuery({
    queryKey: ['profile-pins', username, activeTab],
    queryFn: () =>
      apiGet<PaginatedResponse<Pin>>(`/users/${username}/pins`, {
        tab: activeTab,
        page: 1,
        page_size: 24,
      }),
    enabled: !!username && activeTab !== 'collections',
  })

  const { data: collectionsData, isLoading: collectionsLoading } = useQuery({
    queryKey: ['collections', username],
    queryFn: () => apiGet<Collection[]>(`/users/${username}/collections`),
    enabled: !!username && activeTab === 'collections',
  })

  const isOwner = currentUser?.username === username
  const isPrivate = profile?.isPrivate && !isOwner

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-24 h-24 rounded-full shimmer-loading" />
          <div className="h-6 w-40 shimmer-loading rounded-xl" />
          <div className="h-4 w-64 shimmer-loading rounded-lg" />
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <>
      <Helmet>
        <title>{profile.displayName} (@{profile.username}) — Virens</title>
        <meta name="description" content={profile.bio || `${profile.displayName}'s profile on Virens.`} />
        <meta property="og:title" content={`${profile.displayName} on Virens`} />
        <meta property="og:image" content={profile.avatar || ''} />
        <meta property="og:type" content="profile" />
      </Helmet>

      <div className="pb-24 lg:pb-6">
        {/* Profile header */}
        <div className="relative">
          {/* Cover / pinned media */}
          <div className="h-48 lg:h-64 bg-gradient-to-br from-virens-black-card to-virens-gray overflow-hidden relative">
            {profile.pinnedMediaUrl && (
              <PinnedMedia url={profile.pinnedMediaUrl} type={profile.pinnedMediaType || 'image'} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-virens-black via-transparent to-transparent" />
          </div>

          {/* Avatar + info */}
          <div className="max-w-4xl mx-auto px-4 lg:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 relative z-10">
              <div className="relative">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.displayName}
                    className="w-24 h-24 rounded-2xl border-4 border-virens-black object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl border-4 border-virens-black bg-virens-green/20 flex items-center justify-center">
                    <span className="font-display font-bold text-3xl text-virens-green">
                      {profile.displayName[0]}
                    </span>
                  </div>
                )}
                {profile.isVerified && (
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-virens-green flex items-center justify-center border-2 border-virens-black">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l2.5 2.5L10 3" stroke="#191414" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                )}
              </div>

              <div className="flex-1 pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="font-display font-bold text-2xl text-virens-white">
                        {profile.displayName}
                      </h1>
                      {profile.isPrivate && (
                        <Lock size={14} className="text-virens-white-muted" />
                      )}
                    </div>
                    <p className="text-virens-white-muted text-sm">@{profile.username}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isOwner ? (
                      <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm">
                        Edit Profile
                      </button>
                    ) : (
                      <>
                        <FollowButton username={profile.username} />
                        <button
                          onClick={() => setShowReport(true)}
                          className="btn-ghost text-virens-white-muted"
                        >
                          <Flag size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm text-virens-white-muted mt-2 max-w-lg">{profile.bio}</p>
                )}

                {/* Website */}
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-virens-green hover:text-virens-green/80 mt-1 transition-colors"
                  >
                    <Globe size={11} />
                    {profile.websiteUrl.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-4 pb-2">
              {[
                { label: 'Pins', value: profile.pinsCount },
                { label: 'Followers', value: profile.followersCount },
                { label: 'Following', value: profile.followingCount },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="font-display font-bold text-virens-white">{formatNumber(value)}</span>
                  <span className="text-virens-white-muted text-sm ml-1">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 lg:px-6 mt-6">
          {isPrivate ? (
            <div className="text-center py-20 text-virens-white-muted">
              <Lock size={32} className="mx-auto mb-3 opacity-40" />
              <p className="font-display font-semibold text-lg">This account is private</p>
              <p className="text-sm mt-1">Follow to see their content</p>
            </div>
          ) : (
            <>
              {/* Tab bar */}
              <div className="flex items-center gap-1 border-b border-white/6 mb-6">
                {TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`px-4 py-3 text-sm font-medium transition-all relative
                      ${activeTab === id
                        ? 'text-virens-white'
                        : 'text-virens-white-muted hover:text-virens-white'
                      }`}
                  >
                    {label}
                    {activeTab === id && (
                      <motion.div
                        layoutId="profile-tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-virens-green rounded-t-full"
                      />
                    )}
                  </button>
                ))}
              </div>

              {activeTab === 'collections' ? (
                collectionsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-40 rounded-2xl shimmer-loading" />
                    ))}
                  </div>
                ) : !collectionsData?.length ? (
                  <div className="text-center py-14 text-sm text-virens-white-muted">
                    No collections yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {collectionsData.map((collection) => (
                      <Link
                        key={collection.id}
                        to={`/${username}/collections/${collection.id}`}
                        className="glass-card overflow-hidden group"
                      >
                        <div className="h-28 bg-virens-gray overflow-hidden rounded-t-2xl">
                          {collection.coverImageUrl && (
                            <img
                              src={collection.coverImageUrl}
                              alt={collection.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-semibold text-sm text-virens-white truncate">{collection.name}</p>
                          <p className="text-xs text-virens-white-muted mt-1">{collection.pinsCount} pins</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )
              ) : (
                <MasonryFeed
                  pins={pinsData?.items ?? []}
                  isLoading={pinsLoading}
                  showAds={false}
                  emptyMessage={`No ${activeTab} yet.`}
                />
              )}
            </>
          )}
        </div>
      </div>

      {showEdit && isOwner && (
        <EditProfileModal onClose={() => setShowEdit(false)} />
      )}
      {showReport && (
        <ReportModal
          targetType="user"
          targetId={profile.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  )
}
