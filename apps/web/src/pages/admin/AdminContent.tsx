import { Helmet } from 'react-helmet-async'
export default function AdminContent() {
  return (
    <>
      <Helmet><title>Content — Admin — Virens</title></Helmet>
      <div>
        <h1 className="font-display font-bold text-2xl text-virens-white mb-2">Content Moderation</h1>
        <p className="text-sm text-virens-white-muted mb-6">Review flagged and pending content</p>
        <div className="glass-card p-8 text-center text-virens-white-muted">
          <p className="font-display font-semibold text-virens-white mb-1">Moderation Queue</p>
          <p className="text-sm">All pinned content awaiting review appears here. Reports with highest priority (copyright) surface first.</p>
        </div>
      </div>
    </>
  )
}
