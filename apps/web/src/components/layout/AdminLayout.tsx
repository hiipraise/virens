import { Outlet, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, Flag, Megaphone, DollarSign,
  FileText, ShieldCheck, ChevronRight
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/authStore'

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/content', icon: FileText, label: 'Content' },
  { to: '/admin/reports', icon: Flag, label: 'Reports' },
  { to: '/admin/ads', icon: Megaphone, label: 'Ads' },
  { to: '/admin/revenue', icon: DollarSign, label: 'Revenue' },
]

export default function AdminLayout() {
  const { user } = useAuthStore()

  return (
    <div className="flex h-screen bg-virens-black overflow-hidden">
      {/* Admin sidebar */}
      <aside className="w-60 flex-shrink-0 glass border-r border-white/6 flex flex-col py-6 px-3">
        <div className="flex items-center gap-2 px-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-virens-green/15 border border-virens-green/30 flex items-center justify-center">
            <ShieldCheck size={16} className="text-virens-green" />
          </div>
          <div>
            <p className="font-display font-bold text-virens-white text-sm">Admin Panel</p>
            <p className="text-xs text-virens-white-muted capitalize">{user?.role}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {adminNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-virens-green/12 text-virens-green border border-virens-green/15'
                    : 'text-virens-white-muted hover:text-virens-white hover:bg-white/5'
                )
              }
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />
        <NavLink
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-virens-white-muted hover:text-virens-white transition-colors"
        >
          <ChevronRight size={15} className="rotate-180" />
          Back to App
        </NavLink>
      </aside>

      {/* Admin content */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="p-6 lg:p-8"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  )
}
