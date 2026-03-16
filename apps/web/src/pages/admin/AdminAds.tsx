import { Helmet } from 'react-helmet-async'
export default function AdminAds() {
  return (
    <>
      <Helmet><title>Ads — Admin — Virens</title></Helmet>
      <div>
        <h1 className="font-display font-bold text-2xl text-virens-white mb-2">Ad Management</h1>
        <p className="text-sm text-virens-white-muted mb-6">Review and manage all platform and creator ads</p>
        <div className="glass-card p-8 text-center text-virens-white-muted">
          <p>Platform ad review, approval queue, and performance metrics shown here.</p>
          <p className="text-xs mt-2">Admin, Staff, and SuperAdmin accounts run ads at no cost.</p>
        </div>
      </div>
    </>
  )
}
