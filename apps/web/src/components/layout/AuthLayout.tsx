import { Outlet, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-virens-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background mesh */}
      <div className="absolute inset-0 bg-hero-mesh pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-virens-green/4 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <Outlet />
      </motion.div>
    </div>
  )
}
