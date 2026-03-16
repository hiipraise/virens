import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  hideClose?: boolean
}

const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }

export function Modal({ open, onClose, title, maxWidth = 'md', children, hideClose }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 8 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full ${widths[maxWidth]} glass-card overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || !hideClose) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            {title && (
              <h2 className="font-display font-bold text-virens-white text-base">{title}</h2>
            )}
            {!hideClose && (
              <button
                onClick={onClose}
                className="ml-auto w-7 h-7 rounded-full glass flex items-center justify-center text-virens-white-muted hover:text-virens-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
        {children}
      </motion.div>
    </motion.div>
  )
}
