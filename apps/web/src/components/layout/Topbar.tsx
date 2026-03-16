import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Search, Eye, EyeOff, Bot, BotOff } from 'lucide-react'
import { useFeedStore } from '@/store/feedStore'
import NotificationBell from '@/components/ui/NotificationBell'
import { useAuthStore } from '@/store/authStore'

export default function Topbar() {
  const navigate = useNavigate()
  const { toggleSidebar, showSensitiveContent, toggleSensitiveContent, showAIContent, toggleAIContent } = useFeedStore()
  const { user } = useAuthStore()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <header className="h-16 flex-shrink-0 glass border-b border-white/6 flex items-center gap-3 px-4 lg:px-6 z-20 relative">
      {/* Menu toggle */}
      <button
        onClick={toggleSidebar}
        className="hidden lg:flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/6 text-virens-white-muted hover:text-virens-white transition-all"
      >
        <Menu size={20} strokeWidth={1.8} />
      </button>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className={`relative flex items-center rounded-full transition-all duration-200 ${focused ? 'ring-1 ring-virens-green/40' : ''}`}>
          <Search
            size={16}
            className="absolute left-4 text-virens-white-muted pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search pins, creators, tags..."
            className="w-full bg-virens-gray border border-virens-gray-light text-virens-white
                       placeholder-virens-white-muted rounded-full pl-10 pr-4 py-2.5 text-sm
                       focus:outline-none transition-all duration-200"
          />
        </div>
      </form>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Sensitive content toggle */}
        <button
          onClick={toggleSensitiveContent}
          title={showSensitiveContent ? 'Hide sensitive content' : 'Show sensitive content'}
          className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all
            ${showSensitiveContent
              ? 'bg-virens-warning/15 text-virens-warning'
              : 'hover:bg-white/6 text-virens-white-muted hover:text-virens-white'
            }`}
        >
          {showSensitiveContent ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>

        {/* AI content toggle */}
        <button
          onClick={toggleAIContent}
          title={showAIContent ? 'Hide AI-generated content' : 'Show AI-generated content'}
          className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all
            ${showAIContent
              ? 'bg-virens-info/15 text-virens-info'
              : 'hover:bg-white/6 text-virens-white-muted hover:text-virens-white'
            }`}
        >
          {showAIContent ? <Bot size={18} /> : <BotOff size={18} />}
        </button>

        {/* Notifications */}
        {user && <NotificationBell />}
      </div>
    </header>
  )
}
