import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function NotFoundPage() {
  return (
    <>
      <Helmet><title>404 — Virens</title></Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="font-display font-bold text-8xl text-virens-green">404</p>
        <h1 className="font-display font-bold text-2xl text-virens-white">Page not found</h1>
        <p className="text-virens-white-muted max-w-xs">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary mt-2">Back to Feed</Link>
      </div>
    </>
  )
}
