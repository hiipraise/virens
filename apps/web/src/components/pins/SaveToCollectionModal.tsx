import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Bookmark, Lock, Globe, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useCollections, useCreateCollection, useSaveToCollection } from '@/hooks/useCollections'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'

interface SaveToCollectionModalProps {
  pinId: string
  onClose: () => void
}

export default function SaveToCollectionModal({ pinId, onClose }: SaveToCollectionModalProps) {
  const { user } = useAuthStore()
  const { data: collections, isLoading } = useCollections(user?.username || '')
  const createCollection = useCreateCollection()
  const saveToCollection = useSaveToCollection()

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)

  const handleSave = async (collectionId: string) => {
    await saveToCollection.mutateAsync({ collectionId, pinId })
    onClose()
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    const col = await createCollection.mutateAsync({ name: newName, isPrivate })
    await saveToCollection.mutateAsync({ collectionId: col.id, pinId })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm glass-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-2">
            <Bookmark size={16} className="text-virens-green" />
            <h2 className="font-display font-bold text-virens-white text-base">Save to Collection</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full glass flex items-center justify-center text-virens-white-muted hover:text-virens-white">
            <X size={14} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-2 max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-virens-white-muted" />
            </div>
          ) : !collections?.length ? (
            <p className="text-sm text-virens-white-muted text-center py-4">No collections yet</p>
          ) : (
            collections.map((col) => (
              <button
                key={col.id}
                onClick={() => handleSave(col.id)}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/8 hover:border-virens-green/30 hover:bg-virens-green/5 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-virens-gray overflow-hidden flex-shrink-0">
                  {col.coverImageUrl && (
                    <img src={col.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-virens-white truncate">{col.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {col.isPrivate ? <Lock size={10} className="text-virens-white-muted" /> : <Globe size={10} className="text-virens-white-muted" />}
                    <span className="text-[10px] text-virens-white-muted">{col.pinsCount} pins</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Create new */}
        <div className="p-4 border-t border-white/6">
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-white/15 hover:border-virens-green/30 text-virens-white-muted hover:text-virens-green transition-all text-sm"
            >
              <Plus size={15} /> New Collection
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name..."
                autoFocus
              />
              <Toggle
                checked={isPrivate}
                onChange={setIsPrivate}
                label="Private"
                description="Only visible to you"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1 text-sm">Cancel</button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || createCollection.isPending}
                  className="btn-primary flex-1 text-sm"
                >
                  {createCollection.isPending ? 'Creating...' : 'Create & Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
