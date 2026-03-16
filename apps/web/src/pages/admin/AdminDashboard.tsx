import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Users, Image, Flag, DollarSign, TrendingUp, ShieldAlert, CheckCircle } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { formatNumber, formatPrice } from '@/utils/format'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AdminStats {
  totalUsers: number
  totalPins: number
  pendingReports: number
  totalRevenue: number
  activeAds: number
  removedContent: number
  appealSuccessRate: number
  revenueChart: { date: string; revenue: number; subscriptions: number }[]
}

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiGet<AdminStats>('/admin/stats'),
  })

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, format: formatNumber, color: 'text-virens-info' },
    { label: 'Total Pins', value: stats?.totalPins ?? 0, icon: Image, format: formatNumber, color: 'text-virens-green' },
    { label: 'Pending Reports', value: stats?.pendingReports ?? 0, icon: Flag, format: formatNumber, color: 'text-virens-warning' },
    { label: 'Revenue (MTD)', value: stats?.totalRevenue ?? 0, icon: DollarSign, format: (v: number) => formatPrice(v, '₦'), color: 'text-virens-green' },
    { label: 'Active Ads', value: stats?.activeAds ?? 0, icon: TrendingUp, format: formatNumber, color: 'text-virens-info' },
    { label: 'Removed Content', value: stats?.removedContent ?? 0, icon: ShieldAlert, format: formatNumber, color: 'text-virens-error' },
  ]

  return (
    <>
      <Helmet><title>Admin Dashboard — Virens</title></Helmet>
      <div>
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl text-virens-white">Dashboard</h1>
          <p className="text-sm text-virens-white-muted mt-1">Platform overview and health metrics</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, format, color }) => (
            <div key={label} className="glass-card p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs text-virens-white-muted font-medium">{label}</span>
                <Icon size={18} className={color} />
              </div>
              <p className={`font-display font-bold text-2xl ${color}`}>{format(value as never)}</p>
            </div>
          ))}
        </div>

        {/* Transparency summary */}
        <div className="glass-card p-5 mb-8">
          <h2 className="font-display font-semibold text-virens-white mb-4 flex items-center gap-2">
            <CheckCircle size={16} className="text-virens-green" />
            Transparency Report (Current Month)
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'Content Removed', value: stats?.removedContent ?? 0, desc: 'Across all categories' },
              { label: 'Appeal Success Rate', value: `${stats?.appealSuccessRate ?? 0}%`, desc: 'Of submitted appeals' },
              { label: 'Avg Review Time', value: '4.2h', desc: 'For copyright reports' },
            ].map(({ label, value, desc }) => (
              <div key={label} className="text-center p-3 bg-white/3 rounded-xl">
                <p className="font-display font-bold text-xl text-virens-white">{value}</p>
                <p className="text-sm font-medium text-virens-white mt-0.5">{label}</p>
                <p className="text-xs text-virens-white-muted mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue chart */}
        <div className="glass-card p-5">
          <h2 className="font-display font-semibold text-virens-white mb-5">Revenue Overview</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.revenueChart ?? []}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1DB954" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1DB954" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#a8a0a0" tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
                <YAxis stroke="#a8a0a0" tick={{ fontSize: 11, fontFamily: 'DM Sans' }} tickFormatter={(v) => `₦${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: '#242020', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontFamily: 'DM Sans', fontSize: 12 }}
                  formatter={(v: number) => formatPrice(v, '₦')}
                />
                <Area type="monotone" dataKey="revenue" stroke="#1DB954" strokeWidth={2} fill="url(#revGradient)" name="Revenue" />
                <Area type="monotone" dataKey="subscriptions" stroke="#3b82f6" strokeWidth={2} fill="transparent" name="Subscriptions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  )
}
