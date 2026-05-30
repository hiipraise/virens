import { Helmet } from 'react-helmet-async'
export default function AdminRevenue() {
  return (
    <>
      <Helmet><title>Revenue — Admin — Virens</title></Helmet>
      <div>
        <h1 className="font-display font-bold text-2xl text-virens-white mb-2">Revenue</h1>
        <p className="text-sm text-virens-white-muted mb-6">Local revenue, creator payouts, and financial controls</p>
        <div className="glass-card p-8 text-center text-virens-white-muted">
          <p>Subscription revenue, ad spend, direct sales, and payout management are simulated locally here.</p>
          <p className="text-xs mt-2">Minimum creator payout: ₦10,000. Supported through local bank-transfer and card simulators.</p>
        </div>
      </div>
    </>
  )
}
