import { ExternalLink, Megaphone } from 'lucide-react'

// Placeholder ad card — in production, ad data is fetched from /api/ads/served
export default function AdCard() {
  return (
    <div className="mb-4 rounded-2xl overflow-hidden glass border border-virens-green/10 relative group cursor-pointer">
      <div className="h-40 bg-gradient-to-br from-virens-green/10 to-virens-black-card flex items-center justify-center">
        <Megaphone size={32} className="text-virens-green/30" />
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-virens-white line-clamp-1">Promoted</p>
            <p className="text-xs text-virens-white-muted mt-0.5 line-clamp-2">
              Discover amazing creators on Virens
            </p>
          </div>
          <ExternalLink size={12} className="text-virens-white-muted flex-shrink-0 mt-0.5" />
        </div>
        <span className="absolute top-2 left-2 badge bg-virens-green/15 text-virens-green border border-virens-green/20 text-[9px]">
          Ad
        </span>
      </div>
    </div>
  )
}
