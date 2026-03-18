import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { SUBSCRIPTION_TIERS } from '@/types'
import { apiPost } from '@/lib/api'
import toast from 'react-hot-toast'

const FEATURES = [
  'Ad-free browsing',
  'Download subscriber-only content',
  'Exclusive creator feeds',
  'Priority access to new features',
]

export default function SubscribePage() {
  const [selectedGateway, setSelectedGateway] = useState<'paystack' | 'stripe'>('paystack')
  const tier = SUBSCRIPTION_TIERS.basic

  const mutation = useMutation({
    mutationFn: () =>
      apiPost<{ authorization_url?: string; url?: string }>('/payments/initiate', {
        gateway: selectedGateway,
        type: 'subscription',
        tier: 'basic',
      }),
    onSuccess: (data) => {
      const nextUrl = data.authorization_url || data.url
      if (nextUrl) {
        window.location.href = nextUrl
        return
      }
      toast.success('Subscription started')
    },
    onError: () => toast.error('Unable to start subscription'),
  })

  return (
    <>
      <Helmet>
        <title>Subscribe — Virens</title>
        <meta name="description" content="Unlock the Virens subscription with a single monthly plan." />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-12 pb-24 lg:pb-12">
        <div className="text-center mb-12">
          <div className="divider-green mx-auto mb-4" />
          <h1 className="font-display font-bold text-4xl text-virens-white mb-3">
            One Simple Subscription
          </h1>
          <p className="text-virens-white-muted max-w-lg mx-auto">
            Pay once monthly to remove ads, unlock subscriber downloads, and support creators.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-10">
          <span className="text-sm text-virens-white-muted">Pay with:</span>
          {(['paystack', 'stripe'] as const).map((gw) => (
            <button
              key={gw}
              onClick={() => setSelectedGateway(gw)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border
                ${selectedGateway === gw
                  ? 'border-virens-green bg-virens-green/12 text-virens-green'
                  : 'border-white/10 text-virens-white-muted hover:border-white/20'
                }`}
            >
              {gw === 'paystack' ? 'Paystack (₦)' : 'Stripe (Card)'}
            </button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="tier-card border border-virens-green/25 relative max-w-xl mx-auto featured"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="badge-green text-xs font-semibold px-3 py-1">Single Plan</span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-virens-green">
              <Zap size={20} />
            </div>
            <div>
              <p className="font-display font-bold text-virens-white">{tier.name}</p>
              <div className="flex items-end gap-1">
                <span className="font-display font-bold text-3xl text-virens-white">
                  {tier.currency}{tier.price.toLocaleString()}
                </span>
                <span className="text-xs text-virens-white-muted mb-1">/{tier.interval}</span>
              </div>
            </div>
          </div>

          <div className="divider-green mb-4" />

          <ul className="flex flex-col gap-2.5">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-virens-white">
                <Check size={14} className="text-virens-green mt-0.5 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full py-3 rounded-xl text-sm font-semibold font-display transition-all mt-6 btn-primary"
          >
            {mutation.isPending ? 'Redirecting…' : `Subscribe — ${tier.currency}${tier.price.toLocaleString()}/mo`}
          </button>
        </motion.div>

        <p className="text-center text-xs text-virens-white-muted mt-8">
          One subscription plan only. Monthly billing is ₦700. International card payments are available through Stripe.
        </p>
      </div>
    </>
  )
}
