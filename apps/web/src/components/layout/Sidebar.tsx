import { NavLink, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home, Compass, Search, Upload, Bookmark, Bell,
  Settings, BarChart2, Megaphone, LogOut, ShieldCheck,
  User, CreditCard
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { clsx } from 'clsx'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/explore', icon: Compass, label: 'Explore' },
  { to: '/search', icon: Search, label: 'Search' },
]

const creatorItems = [
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/ads', icon: Megaphone, label: 'Ads Manager' },
]

const accountItems = [
  { to: '/subscribe', icon: CreditCard, label: 'Subscribe' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const isAdmin = user?.role && ['superadmin', 'admin', 'staff'].includes(user.role)

  return (
    <div className="h-full glass border-r border-white/6 flex flex-col py-6 px-4 gap-2">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 px-2 mb-6 group">
        <div className="w-8 h-8 rounded-lg bg-virens-green flex items-center justify-center shadow-green-glow group-hover:scale-105 transition-transform">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L3 5v8l6 4 6-4V5L9 1z" fill="#191414" stroke="none" />
            <circle cx="9" cy="9" r="2.5" fill="#191414" />
          </svg>
        </div>
        <span className="font-display font-bold text-xl text-virens-white tracking-tight">
          Virens
        </span>
      </Link>

      {/* Main nav */}
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'nav-item',
                isActive && 'active text-virens-white bg-white/8'
              )
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Creator tools */}
      {user && (
        <>
          <div className="mt-4 mb-1 px-2">
            <span className="text-xs font-semibold text-virens-white-muted uppercase tracking-widest">
              Create
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            {creatorItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx('nav-item', isActive && 'active text-virens-white bg-white/8')
                }
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </>
      )}

      {/* Admin link */}
      {isAdmin && (
        <>
          <div className="mt-4 mb-1 px-2">
            <span className="text-xs font-semibold text-virens-green uppercase tracking-widest">
              Admin
            </span>
          </div>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              clsx('nav-item', isActive && 'active text-virens-green bg-virens-green/8')
            }
          >
            <ShieldCheck size={18} strokeWidth={1.8} />
            <span>Dashboard</span>
          </NavLink>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Account bottom section */}
      <div className="flex flex-col gap-1 border-t border-white/6 pt-4">
        {accountItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx('nav-item', isActive && 'active text-virens-white bg-white/8')
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}

        {user ? (
          <>
            <Link
              to={`/${user.username}`}
              className="nav-item mt-1 hover:bg-white/5"
            >
              <div className="relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-virens-green/20 flex items-center justify-center">
                    <User size={12} className="text-virens-green" />
                  </div>
                )}
                {user.isVerified && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-virens-green flex items-center justify-center">
                    <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                      <path d="M1 3l1.5 1.5L5 1.5" stroke="#191414" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-virens-white truncate">{user.displayName}</p>
                <p className="text-xs text-virens-white-muted truncate">@{user.username}</p>
              </div>
            </Link>
            <button
              onClick={logout}
              className="nav-item text-virens-white-muted hover:text-virens-error"
            >
              <LogOut size={18} strokeWidth={1.8} />
              <span>Sign out</span>
            </button>
          </>
        ) : (
          <Link to="/login" className="btn-primary text-center mt-2 text-sm">
            Sign in
          </Link>
        )}
      </div>
    </div>
  )
}
