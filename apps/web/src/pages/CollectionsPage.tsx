import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Plus, Lock, Globe } from 'lucide-react'
import { apiGet } from '@/lib/api'
import type { Collection } from '@/types'
import { useAuthStore } from '@/store/authStore'

export default function CollectionsPage() {
  const { username } = useParams<{ username: string }>()
  const { user } = useAuthStore()
  const isOwner = user?.username === username

  const { data: collections, isLoading } = useQuery({
    queryKey: ['collections', username],
    queryFn: () => apiGet<Collection[]>(`/users/${username}/collections`),
    enabled: !!username,
  })

  return (
    <>
      <Helmet><title>Collections — {username} — Virens</title></Helmet>
      <div className="px-4 lg:px-6 py-6 pb-24 lg:pb-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-xl text-virens-white">Collections</h1>
          {isOwner && (
            <button className="btn-primary text-sm flex items-center gap-2">
              <Plus size={15} /> New Collection
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shimmer-loading rounded-2xl" style={{ height: 180 }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {collections?.map((col) => (
              <Link
                key={col.id}
                to={`/${username}/collections/${col.id}`}
                className="glass-card overflow-hidden group"
              >
                <div className="h-28 bg-virens-gray overflow-hidden rounded-t-2xl">
                  {col.coverImageUrl && (
                    <img src={col.coverImageUrl} alt={col.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1.5">
                    {col.isPrivate ? <Lock size={11} className="text-virens-white-muted" /> : <Globe size={11} className="text-virens-white-muted" />}
                    <p className="font-semibold text-sm text-virens-white truncate">{col.name}</p>
                  </div>
                  <p className="text-xs text-virens-white-muted mt-0.5">{col.pinsCount} pins</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
