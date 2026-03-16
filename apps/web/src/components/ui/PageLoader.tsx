import { motion } from 'framer-motion'

export default function PageLoader() {
  return (
    <div className="fixed inset-0 bg-virens-black flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-2 border-virens-green/20 border-t-virens-green"
        />
        <span className="font-display font-semibold text-virens-white-muted text-sm">Virens</span>
      </div>
    </div>
  )
}
