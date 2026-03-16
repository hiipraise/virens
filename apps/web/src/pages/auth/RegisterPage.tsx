import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register, isLoading } = useAuthStore()
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' })
  const [showPwd, setShowPwd] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register(form)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Registration failed')
    }
  }

  return (
    <>
      <Helmet><title>Create Account — Virens</title></Helmet>
      <div className="glass-card p-8">
        <div className="flex items-center gap-2 mb-7 justify-center">
          <div className="w-9 h-9 rounded-xl bg-virens-green flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L4 6v8l6 4 6-4V6L10 2z" fill="#191414" />
              <circle cx="10" cy="10" r="2.5" fill="#191414" />
            </svg>
          </div>
          <span className="font-display font-bold text-2xl text-virens-white">Virens</span>
        </div>
        <h1 className="font-display font-bold text-xl text-virens-white text-center mb-1">Create your account</h1>
        <p className="text-sm text-virens-white-muted text-center mb-7">Start sharing your work today</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-virens-white-muted mb-1.5">Display Name</label>
              <input value={form.displayName} onChange={(e) => set('displayName', e.target.value)} required className="input-field" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="block text-xs text-virens-white-muted mb-1.5">Username</label>
              <input value={form.username} onChange={(e) => set('username', e.target.value.toLowerCase())} required className="input-field" placeholder="janedoe" pattern="[a-z0-9_]+" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-virens-white-muted mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required className="input-field" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-xs text-virens-white-muted mb-1.5">Password</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={8} className="input-field pr-10" placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-virens-white-muted">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 mt-1">
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-xs text-virens-white-muted text-center mt-5">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
        <p className="text-sm text-virens-white-muted text-center mt-3">
          Have an account?{' '}
          <Link to="/login" className="text-virens-green hover:text-virens-green/80 font-medium">Sign in</Link>
        </p>
      </div>
    </>
  )
}
