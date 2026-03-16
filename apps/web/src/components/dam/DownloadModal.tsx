import { motion } from 'framer-motion'
import { X, Lock, Download, ShieldCheck, User, Tag } from 'lucide-react'
import type { Pin } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { formatPrice } from '@/utils/format'
import { usePinActions } from '@/hooks/usePinActions'

interface DownloadModalProps {
  pin: Pin
  onClose: () => void
}

const PERM_LABELS = {
  free: { label: 'Free Download', color: 'text-virens-green', icon: Download },
  subscribers_only: { label: 'Subscribers Only', color: 'text-virens-info', icon: Lock },
  paid: { label: 'Paid Download', color: 'text-virens-warning', icon: Tag },
  none: { label: 'No Downloads', color: 'text-virens-error', icon: Lock },
}

export default function DownloadModal({ pin, onClose }: DownloadModalProps) {
  const { user } = useAuthStore()
  const { download } = usePinActions(pin.id)
  const perm = PERM_LABELS[pin.downloadPermission]
  const PermIcon = perm.icon

  const canDownloadFree = pin.downloadPermission === 'free'
  const canDownloadSubscriber =
    pin.downloadPermission === 'subscribers_only' &&
    user?.subscriptionTier !== 'none'
  const needsPurchase = pin.downloadPermission === 'paid'

  const handleDownload = async () => {
    await download()
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
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm glass-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full glass flex items-center justify-center text-virens-white-muted hover:text-virens-white transition-colors"
        >
          <X size={16} />
        </button>

        {/* Preview */}
        <div className="relative h-44 overflow-hidden rounded-t-2xl">
          <img
            src={pin.thumbnailUrl}
            alt={pin.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-virens-black-card via-transparent to-transparent" />
          {/* Resolution badge */}
          <span className="absolute bottom-3 right-3 badge-gray text-[10px]">
            {pin.originalWidth} x {pin.originalHeight}px
          </span>
        </div>

        {/* Info */}
        <div className="p-5 flex flex-col gap-4">
          <div>
            <h3 className="font-display font-bold text-virens-white text-base line-clamp-1">
              {pin.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <User size={12} className="text-virens-white-muted" />
              <span className="text-xs text-virens-white-muted">{pin.creator.displayName}</span>
              {pin.creator.isVerified && (
                <span className="verified-badge">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4l1.8 1.8L6.5 2.5" stroke="#191414" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </span>
              )}
            </div>
          </div>

          {/* License type */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/4 border border-white/6">
            <PermIcon size={16} className={perm.color} />
            <div>
              <p className={`text-sm font-semibold ${perm.color}`}>{perm.label}</p>
              {pin.licenseType && (
                <p className="text-xs text-virens-white-muted">{pin.licenseType}</p>
              )}
            </div>
          </div>

          {/* Price section */}
          {needsPurchase && pin.downloadPrice && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-virens-white-muted">Download price</span>
              <div className="flex items-center gap-2">
                {pin.originalPrice && pin.originalPrice > pin.downloadPrice && (
                  <span className="price-original">{formatPrice(pin.originalPrice, pin.currency)}</span>
                )}
                <span className="price-sale">{formatPrice(pin.downloadPrice, pin.currency)}</span>
              </div>
            </div>
          )}

          {/* CTA */}
          {pin.downloadPermission === 'none' ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-virens-error/10 border border-virens-error/20">
              <Lock size={14} className="text-virens-error" />
              <p className="text-sm text-virens-error">Downloads disabled by creator</p>
            </div>
          ) : canDownloadFree || canDownloadSubscriber ? (
            <button onClick={handleDownload} className="btn-primary w-full flex items-center justify-center gap-2">
              <Download size={16} />
              Download Free
            </button>
          ) : pin.downloadPermission === 'subscribers_only' ? (
            <a href="/subscribe" className="btn-secondary w-full text-center text-sm flex items-center justify-center gap-2">
              <Lock size={14} />
              Subscribe to Download
            </a>
          ) : (
            <button className="btn-primary w-full flex items-center justify-center gap-2">
              <Tag size={14} />
              Purchase {formatPrice(pin.downloadPrice || 0, pin.currency)}
            </button>
          )}

          <p className="text-xs text-center text-virens-white-muted">
            Protected by Virens DAM. Creator retains all rights.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
