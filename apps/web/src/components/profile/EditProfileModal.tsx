import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, User, Globe, Lock, Camera } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPatch, apiUpload } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Input, Textarea } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Avatar } from '@/components/ui/Avatar'
import toast from 'react-hot-toast'
import type { User as UserType } from '@/types'

interface EditProfileModalProps {
  onClose: () => void
}

export default function EditProfileModal({ onClose }: EditProfileModalProps) {
  const { user, refreshUser } = useAuthStore()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    websiteUrl: user?.websiteUrl || '',
    isPrivate: user?.isPrivate || false,
  })

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  const avatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return apiUpload<UserType>('/users/me/avatar', formData)
    },
    onSuccess: async () => {
      await refreshUser()
      if (user) qc.invalidateQueries({ queryKey: ['profile', user.username] })
      toast.success('Profile image updated')
    },
    onError: () => toast.error('Failed to upload image'),
  })

  const mutation = useMutation({
    mutationFn: () => apiPatch<UserType>('/users/me', {
      displayName: form.displayName,
      bio: form.bio,
      websiteUrl: form.websiteUrl,
      isPrivate: form.isPrivate,
    }),
    onSuccess: () => {
      refreshUser()
      if (user) qc.invalidateQueries({ queryKey: ['profile', user.username] })
      toast.success('Profile updated')
      onClose()
    },
    onError: () => toast.error('Failed to update profile'),
  })

  if (!user) return null

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
        className="relative w-full max-w-md glass-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-2">
            <User size={16} className="text-virens-green" />
            <h2 className="font-display font-bold text-virens-white">Edit Profile</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full glass flex items-center justify-center text-virens-white-muted hover:text-virens-white">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar src={user.avatar} alt={user.displayName} size="lg" isVerified={user.isVerified} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-virens-green flex items-center justify-center shadow-green-glow"
              >
                <Camera size={12} className="text-virens-black" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) avatarMutation.mutate(file)
              }}
            />
            <div>
              <p className="text-sm font-semibold text-virens-white">{user.displayName}</p>
              <p className="text-xs text-virens-white-muted">@{user.username}</p>
            </div>
          </div>

          <Input
            label="Display Name"
            value={form.displayName}
            onChange={(e) => set('displayName', e.target.value)}
            maxLength={60}
          />

          <Textarea
            label="Bio"
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            placeholder="Tell people about your work..."
            rows={3}
            maxLength={500}
          />

          <Input
            label="Website"
            value={form.websiteUrl}
            onChange={(e) => set('websiteUrl', e.target.value)}
            placeholder="https://yourwebsite.com"
            type="url"
            leftIcon={<Globe size={14} />}
          />

          <Toggle
            checked={form.isPrivate}
            onChange={(v) => set('isPrivate', v)}
            label="Private Account"
            description="Only approved followers can see your pins"
          />
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.displayName.trim()}
            className="btn-primary flex-1 text-sm"
          >
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
