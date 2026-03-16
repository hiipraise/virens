import { NavLink, Link } from 'react-router-dom'
import { Home, Compass, Upload, Bookmark, User } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { clsx } from 'clsx'

const mobileNav = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/explore', icon: Compass, label: 'Explore' },
  { to: '/upload', icon: Upload, label: 'Upload', highlight: true },
  { to: '/search', icon: Bookmark, label: 'Saved' },
]

export default function MobileNav() {
  const { user } = useAuthStore()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/6 flex items-center justify-around h-16 px-2">
      {mobileNav.map(({ to, icon: Icon, label, highlight }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all',
              highlight
                ? 'bg-virens-green text-virens-black w-12 h-12 flex items-center justify-center rounded-full -mt-4 shadow-green-glow'
                : isActive
                ? 'text-virens-white'
                : 'text-virens-white-muted'
            )
          }
        >
          <Icon size={highlight ? 22 : 20} strokeWidth={1.8} />
          {!highlight && <span className="text-[10px] font-medium">{label}</span>}
        </NavLink>
      ))}

      {/* Profile */}
      <Link
        to={user ? `/${user.username}` : '/login'}
        className="flex flex-col items-center gap-1 px-3 py-2 text-virens-white-muted"
      >
        {user?.avatar ? (
          <img src={user.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
        ) : (
          <User size={20} strokeWidth={1.8} />
        )}
        <span className="text-[10px] font-medium">Profile</span>
      </Link>
    </nav>
  )
}
