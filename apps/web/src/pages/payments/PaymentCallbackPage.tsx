import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { apiGet, apiPost } from '@/lib/api'
import toast from 'react-hot-toast'

type CallbackState = 'loading' | 'success' | 'error'

type PendingAd = {
  targetType: 'pin' | 'product' | 'profile'
  targetId: string
  headline: string
  description?: string
  ctaText: string
  ctaUrl: string
}

const PENDING_AD_KEY = 'virens.pendingAdDraft'

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams()
  const refreshUser = useAuthStore((state) => state.refreshUser)
  const [state, setState] = useState<CallbackState>('loading')
  const [message, setMessage] = useState('Confirming your payment...')
  const [destination, setDestination] = useState('/settings')

  const reference = useMemo(() => searchParams.get('reference') || searchParams.get('trxref') || '', [searchParams])
  const status = useMemo(() => searchParams.get('status') || '', [searchParams])
  const paymentType = useMemo(() => searchParams.get('type') || '', [searchParams])

  useEffect(() => {
    const handleCallback = async () => {
      if (status === 'cancelled') {
        setState('error')
        setMessage('Payment was cancelled before it completed.')
        return
      }

      if (!reference) {
        setState('error')
        setMessage('Missing payment reference. Please retry from the previous page.')
        return
      }

      try {
        const verification = await apiGet<{ status: string; amount: number }>(`/payments/verify/${reference}`)

        if (verification.status !== 'success') {
          setState('error')
          setMessage('We could not verify this payment yet. Please wait a moment and try again.')
          return
        }

        const pendingAdRaw = window.sessionStorage.getItem(PENDING_AD_KEY)
        if (pendingAdRaw) {
          const pendingAd = JSON.parse(pendingAdRaw) as PendingAd
          await apiPost('/ads', { ...pendingAd, budget: 200 })
          window.sessionStorage.removeItem(PENDING_AD_KEY)
          toast.success('Ad campaign created successfully')
          setDestination('/ads')
          setState('success')
          setMessage('Your ₦200 ad payment was confirmed and your campaign is now queued.')
          return
        }

        if (paymentType === 'subscription' || verification.amount === 700) {
          await refreshUser()
          setDestination('/settings')
          setState('success')
          setMessage('Your ₦700 subscription is active.')
          return
        }

        setState('success')
        setMessage('Payment confirmed successfully.')
      } catch {
        setState('error')
        setMessage('Something went wrong while finalizing your payment. Please contact support if you were charged.')
      }
    }

    handleCallback()
  }, [paymentType, reference, refreshUser, status])

  const isSuccess = state === 'success'
  const Icon = state === 'loading' ? Loader2 : isSuccess ? CheckCircle2 : XCircle

  return (
    <div className="max-w-xl mx-auto px-4 py-16 pb-24 lg:pb-12">
      <div className="glass-card p-8 text-center">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
          state === 'loading' ? 'bg-white/5 text-virens-white-muted' : isSuccess ? 'bg-virens-green/10 text-virens-green' : 'bg-red-500/10 text-red-400'
        }`}>
          <Icon className={state === 'loading' ? 'animate-spin' : ''} size={28} />
        </div>

        <h1 className="font-display text-2xl font-bold text-virens-white mb-2">
          {state === 'loading' ? 'Processing payment' : isSuccess ? 'Payment confirmed' : 'Payment issue'}
        </h1>
        <p className="text-sm text-virens-white-muted">{message}</p>

        {reference && (
          <p className="mt-4 text-xs text-virens-white-muted">Reference: {reference}</p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to={isSuccess ? destination : '/subscribe'} className="btn-primary text-sm">
            {isSuccess ? 'Continue' : 'Try again'}
          </Link>
          <Link to="/" className="btn-secondary text-sm">Go home</Link>
        </div>
      </div>
    </div>
  )
}
