import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Megaphone, TrendingUp, Eye, MousePointer, Plus, DollarSign } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import CreateAdModal from '@/components/ads/CreateAdModal'
import { apiGet } from '@/lib/api'
import type { Ad } from '@/types'
import { formatNumber, formatPrice } from '@/utils/format'

export default function AdsPage() {
  const [showCreate, setShowCreate] = useState(false)

  const { data: ads, isLoading } = useQuery({
    queryKey: ['my-ads'],
    queryFn: () => apiGet<Ad[]>('/ads/my'),
  })

  const stats = [
    { label: 'Total Reach', value: ads?.reduce((s, a) => s + a.reach, 0) ?? 0, icon: Eye, format: formatNumber },
    { label: 'Total Clicks', value: ads?.reduce((s, a) => s + a.clicks, 0) ?? 0, icon: MousePointer, format: formatNumber },
    { label: 'Total Spent', value: ads?.reduce((s, a) => s + a.spent, 0) ?? 0, icon: DollarSign, format: (v: number) => formatPrice(v, '₦') },
    { label: 'Active Ads', value: ads?.filter((a) => a.status === 'active').length ?? 0, icon: TrendingUp, format: String },
  ]

  return (
    <>
      <Helmet><title>Ads Manager — Virens</title></Helmet>
      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8 pb-24 lg:pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl text-virens-white">Ads Manager</h1>
            <p className="text-sm text-virens-white-muted mt-1">Promote your pins, products, and profile</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Create Ad
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, format }) => (
            <div key={label} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={15} className="text-virens-green" />
                <span className="text-xs text-virens-white-muted">{label}</span>
              </div>
              <p className="font-display font-bold text-xl text-virens-white">{format(value as never)}</p>
            </div>
          ))}
        </div>

        {/* Pricing info */}
        <div className="glass-card p-5 mb-8">
          <h2 className="font-display font-semibold text-virens-white mb-3">Ad Pricing</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { type: 'Promoted Pin', range: '₦5,000 – ₦50,000', desc: 'Based on reach and duration' },
              { type: 'Promoted Profile', range: '₦3,000 – ₦30,000', desc: 'Boost your creator visibility' },
            ].map(({ type, range, desc }) => (
              <div key={type} className="p-3 bg-white/4 rounded-xl border border-white/6">
                <p className="font-semibold text-sm text-virens-white">{type}</p>
                <p className="text-virens-green font-display font-bold text-base mt-0.5">{range}</p>
                <p className="text-xs text-virens-white-muted mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ads table */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/6">
            <h2 className="font-display font-semibold text-virens-white">Your Campaigns</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-virens-white-muted">Loading...</div>
          ) : !ads?.length ? (
            <div className="p-12 text-center">
              <Megaphone size={32} className="mx-auto mb-3 text-virens-white-muted opacity-40" />
              <p className="font-display font-semibold text-virens-white">No campaigns yet</p>
              <p className="text-sm text-virens-white-muted mt-1">Create your first ad to reach more people</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 text-sm">
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/6">
                    {['Campaign', 'Status', 'Reach', 'Clicks', 'Spent', 'Budget'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-virens-white-muted px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ads.map((ad) => (
                    <tr key={ad.id} className="border-b border-white/4 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-virens-white">{ad.headline}</p>
                        <p className="text-xs text-virens-white-muted capitalize">{ad.targetType}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${ad.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                          {ad.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-virens-white">{formatNumber(ad.reach)}</td>
                      <td className="px-4 py-3 text-sm text-virens-white">{formatNumber(ad.clicks)}</td>
                      <td className="px-4 py-3 text-sm text-virens-white">{formatPrice(ad.spent, '₦')}</td>
                      <td className="px-4 py-3 text-sm text-virens-white">{formatPrice(ad.budget, '₦')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
