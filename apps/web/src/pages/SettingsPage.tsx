import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, Bell, Shield, CreditCard, Building2, Link2, Check, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useFeedStore } from '@/store/feedStore'
import { Toggle } from '@/components/ui/Toggle'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SUBSCRIPTION_TIERS } from '@/types'

type Tab = 'profile' | 'privacy' | 'notifications' | 'security' | 'payouts' | 'subscription'

const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'privacy', icon: Lock, label: 'Privacy' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'security', icon: Shield, label: 'Security' },
  { id: 'payouts', icon: Building2, label: 'Payouts' },
  { id: 'subscription', icon: CreditCard, label: 'Subscription' },
]

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { showSensitiveContent, toggleSensitiveContent, showAIContent, toggleAIContent } = useFeedStore()
  const [tab, setTab] = useState<Tab>('profile')

  if (!user) return null

  return (
    <>
      <Helmet><title>Settings — Virens</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8 pb-24 lg:pb-8">
        <h1 className="font-display font-bold text-2xl text-virens-white mb-8">Settings</h1>
        <div className="grid lg:grid-cols-[220px_1fr] gap-6">
          <nav className="flex flex-col gap-1">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${tab === id ? 'bg-virens-green/12 text-virens-green border border-virens-green/15' : 'text-virens-white-muted hover:text-virens-white hover:bg-white/5'}`}>
                <Icon size={16} strokeWidth={1.8} />{label}
              </button>
            ))}
          </nav>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="glass-card p-6 flex flex-col gap-5">
              {tab === 'profile' && <>
                <h2 className="font-display font-semibold text-virens-white">Profile Information</h2>
                <Input label="Display Name" defaultValue={user.displayName} />
                <div><label className="block text-xs text-virens-white-muted mb-1.5">Bio</label>
                  <textarea defaultValue={user.bio || ''} rows={3} className="input-field text-sm resize-none w-full" /></div>
                <Input label="Website" defaultValue={user.websiteUrl || ''} type="url" placeholder="https://" leftIcon={<Link2 size={14} />} />
                <Button>Save Changes</Button>
              </>}
              {tab === 'privacy' && <>
                <h2 className="font-display font-semibold text-virens-white">Privacy & Content</h2>
                <Toggle label="Private Account" description="Only approved followers can see your pins" checked={user.isPrivate} onChange={() => {}} />
                <div className="border-t border-white/6" />
                <h2 className="font-display font-semibold text-virens-white">Feed Preferences</h2>
                <Toggle label="Show Sensitive Content" description="Display content marked as sensitive" checked={showSensitiveContent} onChange={toggleSensitiveContent} />
                <Toggle label="Show AI-Generated Content" description="Display pins marked as AI-generated" checked={showAIContent} onChange={toggleAIContent} />
              </>}
              {tab === 'notifications' && <>
                <h2 className="font-display font-semibold text-virens-white">Notification Preferences</h2>
                {['Likes on your pins', 'New followers', 'Comments', 'Reposts', 'Sales', 'Payout updates'].map(l => (
                  <Toggle key={l} label={l} checked={true} onChange={() => {}} />
                ))}
              </>}
              {tab === 'security' && <>
                <h2 className="font-display font-semibold text-virens-white">Change Password</h2>
                <Input label="Current Password" type="password" />
                <Input label="New Password" type="password" hint="Min 8 chars with letters and numbers" />
                <Input label="Confirm New Password" type="password" />
                <Button>Update Password</Button>
                <div className="border-t border-white/6" />
                <div className="p-4 rounded-xl bg-virens-error/8 border border-virens-error/20 flex items-start gap-3">
                  <AlertCircle size={16} className="text-virens-error flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-virens-white">Delete Account</p>
                    <p className="text-xs text-virens-white-muted mt-0.5">Permanently delete your account and all data.</p>
                    <button className="text-xs text-virens-error mt-2 font-medium hover:text-virens-error/80">Delete my account</button>
                  </div>
                </div>
              </>}
              {tab === 'payouts' && <>
                <h2 className="font-display font-semibold text-virens-white">Nigerian Bank Account</h2>
                <p className="text-sm text-virens-white-muted">Payouts via Paystack. Minimum withdrawal: ₦10,000.</p>
                <Input label="Bank Code" placeholder="e.g. 044" />
                <Input label="Account Number" maxLength={10} />
                <Input label="Account Name" />
                <Button>Save Bank Details</Button>
                <div className="border-t border-white/6" />
                <h2 className="font-display font-semibold text-virens-white">International (Stripe)</h2>
                <Button variant="secondary">Connect Stripe Account</Button>
              </>}
              {tab === 'subscription' && <>
                <h2 className="font-display font-semibold text-virens-white">Current Plan</h2>
                <div className="p-4 glass rounded-xl border border-virens-green/20 flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-virens-white capitalize">
                      {user.subscriptionTier === 'none' ? 'Free Plan' : (SUBSCRIPTION_TIERS as Record<string,{name:string;price:number}>)[user.subscriptionTier]?.name}
                    </p>
                    {user.subscriptionTier !== 'none' && (
                      <p className="text-xs text-virens-white-muted mt-0.5">
                        ₦{(SUBSCRIPTION_TIERS as Record<string,{price:number}>)[user.subscriptionTier]?.price.toLocaleString()}/mo
                      </p>
                    )}
                  </div>
                  {user.subscriptionTier !== 'none' && (
                    <span className="badge-green text-xs flex items-center gap-1"><Check size={10} />Active</span>
                  )}
                </div>
                {user.subscriptionTier === 'none'
                  ? <a href="/subscribe" className="btn-primary text-center text-sm">Upgrade Plan</a>
                  : <button className="text-sm text-virens-white-muted hover:text-virens-error transition-colors">Cancel subscription</button>
                }
              </>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
