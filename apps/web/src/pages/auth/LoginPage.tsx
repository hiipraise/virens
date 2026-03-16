import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
    } catch {
      toast.error('Invalid email or password')
    }
  }

  return (
    <>
      <Helmet><title>Sign In — Virens</title></Helmet>
      <div className="glass-card p-8">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-virens-green flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L4 6v8l6 4 6-4V6L10 2z" fill="#191414" />
              <circle cx="10" cy="10" r="2.5" fill="#191414" />
            </svg>
          </div>
          <span className="font-display font-bold text-2xl text-virens-white">Virens</span>
        </div>
        <h1 className="font-display font-bold text-xl text-virens-white text-center mb-1">Welcome back</h1>
        <p className="text-sm text-virens-white-muted text-center mb-7">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-virens-white-muted mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-xs text-virens-white-muted mb-1.5">Password</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field pr-10" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-virens-white-muted hover:text-virens-white">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2 py-3">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-sm text-virens-white-muted text-center mt-6">
          No account?{' '}
          <Link to="/register" className="text-virens-green hover:text-virens-green/80 transition-colors font-medium">
            Create one
          </Link>
        </p>
      </div>
    </>
  )
}
