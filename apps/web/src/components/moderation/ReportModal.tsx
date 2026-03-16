import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Flag, AlertTriangle, Copyright, Eye, MessageSquareWarning, Repeat, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiPost } from '@/lib/api'
import type { ReportReason } from '@/types'

interface ReportModalProps {
  targetType: 'pin' | 'user' | 'comment'
  targetId: string
  onClose: () => void
}

const REASONS: { id: ReportReason; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'copyright', label: 'Copyright Violation', icon: Copyright, desc: 'This content uses my intellectual property without permission' },
  { id: 'plagiarism', label: 'Plagiarism', icon: Repeat, desc: 'This content is stolen or copied from another creator' },
  { id: 'sensitive_content', label: 'Sensitive Content', icon: Eye, desc: 'Contains adult or disturbing content not properly labeled' },
  { id: 'harassment', label: 'Harassment', icon: MessageSquareWarning, desc: 'Targets or threatens an individual' },
  { id: 'spam', label: 'Spam', icon: AlertTriangle, desc: 'Repetitive, promotional, or misleading content' },
  { id: 'misinformation', label: 'Misinformation', icon: HelpCircle, desc: 'Contains false or misleading claims' },
]

export default function ReportModal({ targetType, targetId, onClose }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!selectedReason) return
    setIsSubmitting(true)
    try {
      await apiPost('/reports', {
        target_type: targetType,
        target_id: targetId,
        reason: selectedReason,
        description,
      })
      setSubmitted(true)
      toast.success('Report submitted. Thank you.')
      setTimeout(onClose, 2000)
    } catch {
      toast.error('Failed to submit report.')
    } finally {
      setIsSubmitting(false)
    }
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
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md glass-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/6">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-virens-error" />
            <h2 className="font-display font-bold text-virens-white">Report Content</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full glass flex items-center justify-center text-virens-white-muted hover:text-virens-white">
            <X size={14} />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-virens-green/15 flex items-center justify-center mx-auto mb-3">
              <Flag size={22} className="text-virens-green" />
            </div>
            <p className="font-display font-semibold text-virens-white">Report Submitted</p>
            <p className="text-sm text-virens-white-muted mt-1">
              Our team will review this. You can appeal any of our decisions if you believe they are incorrect.
            </p>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-4">
            <p className="text-sm text-virens-white-muted">
              Select a reason for reporting this {targetType}:
            </p>

            <div className="flex flex-col gap-2">
              {REASONS.map(({ id, label, icon: Icon, desc }) => (
                <label
                  key={id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
                    ${selectedReason === id
                      ? 'border-virens-error/40 bg-virens-error/8'
                      : 'border-white/8 hover:border-white/15'
                    }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    className="sr-only"
                    checked={selectedReason === id}
                    onChange={() => setSelectedReason(id)}
                  />
                  <Icon size={15} className={selectedReason === id ? 'text-virens-error' : 'text-virens-white-muted'} />
                  <div>
                    <p className="text-sm font-medium text-virens-white">{label}</p>
                    <p className="text-xs text-virens-white-muted mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {selectedReason && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details (optional)..."
                  rows={3}
                  className="input-field text-sm resize-none"
                />
              </motion.div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>

            <p className="text-xs text-center text-virens-white-muted">
              False reports may result in penalties. You may appeal any moderation decision.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
