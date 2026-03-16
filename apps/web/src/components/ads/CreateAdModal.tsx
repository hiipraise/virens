import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Megaphone, Target, DollarSign } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '@/lib/api'
import { Input, Textarea } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import type { Ad } from '@/types'

interface CreateAdModalProps {
  onClose: () => void
}

export default function CreateAdModal({ onClose }: CreateAdModalProps) {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.role && ['superadmin', 'admin', 'staff'].includes(user.role)

  const [form, setForm] = useState({
    targetType: 'pin' as 'pin' | 'product' | 'profile',
    targetId: '',
    headline: '',
    description: '',
    ctaText: 'Learn More',
    ctaUrl: '',
    budget: '',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: () =>
      apiPost<Ad>('/ads', {
        ...form,
        budget: isAdmin ? 0 : parseFloat(form.budget),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-ads'] })
      toast.success('Ad campaign created!')
      onClose()
    },
    onError: () => toast.error('Failed to create ad'),
  })

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
        className="relative w-full max-w-lg glass-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-2">
            <Megaphone size={16} className="text-virens-green" />
            <h2 className="font-display font-bold text-virens-white">Create Campaign</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full glass flex items-center justify-center text-virens-white-muted hover:text-virens-white">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* Target type */}
          <div>
            <label className="block text-xs text-virens-white-muted mb-2 flex items-center gap-1.5">
              <Target size={12} /> Promote
            </label>
            <div className="flex gap-2">
              {(['pin', 'product', 'profile'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => set('targetType', t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all border
                    ${form.targetType === t
                      ? 'border-virens-green/40 bg-virens-green/10 text-virens-green'
                      : 'border-white/8 text-virens-white-muted hover:border-white/15'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Input
            label={`${form.targetType.charAt(0).toUpperCase() + form.targetType.slice(1)} ID`}
            value={form.targetId}
            onChange={(e) => set('targetId', e.target.value)}
            placeholder="Paste pin/product/profile ID"
          />

          <Input
            label="Headline"
            value={form.headline}
            onChange={(e) => set('headline', e.target.value)}
            placeholder="Grab attention in one line"
            maxLength={100}
          />

          <Textarea
            label="Description (optional)"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Tell users more about your promotion..."
            rows={2}
            maxLength={300}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="CTA Text"
              value={form.ctaText}
              onChange={(e) => set('ctaText', e.target.value)}
              placeholder="Learn More"
              maxLength={30}
            />
            <Input
              label="CTA URL"
              value={form.ctaUrl}
              onChange={(e) => set('ctaUrl', e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>

          {!isAdmin && (
            <div>
              <label className="block text-xs text-virens-white-muted mb-1.5 flex items-center gap-1.5">
                <DollarSign size={12} /> Budget (₦)
              </label>
              <Input
                value={form.budget}
                onChange={(e) => set('budget', e.target.value)}
                placeholder="Minimum ₦5,000"
                type="number"
                min="5000"
                max="50000"
              />
              <p className="text-[10px] text-virens-white-muted mt-1">
                Promoted Pin: ₦5,000–₦50,000 · Profile: ₦3,000–₦30,000
              </p>
            </div>
          )}

          {isAdmin && (
            <div className="p-3 rounded-xl bg-virens-green/8 border border-virens-green/15">
              <p className="text-xs text-virens-green font-medium">Admin — running ad at no cost</p>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-white/6">
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.headline || !form.ctaUrl || (!isAdmin && !form.budget)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Megaphone size={15} />
            {mutation.isPending ? 'Creating...' : isAdmin ? 'Launch Campaign' : `Launch — ₦${Number(form.budget || 0).toLocaleString()}`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
