import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

interface TagStripProps {
  activeTag: string | null
  onSelect: (tag: string | null) => void
}

export default function TagStrip({ activeTag, onSelect }: TagStripProps) {
  const { data: tags } = useQuery({
    queryKey: ['trending-tags'],
    queryFn: () => apiGet<string[]>('/tags/trending'),
    staleTime: 1000 * 60 * 10,
  })

  if (!tags?.length) return null

  return (
    <div className="scroll-x mb-2">
      <button
        onClick={() => onSelect(null)}
        className={`tag-chip flex-shrink-0 ${!activeTag ? 'bg-virens-green/15 text-virens-green border-virens-green/25' : ''}`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelect(tag === activeTag ? null : tag)}
          className={`tag-chip ${tag === activeTag ? 'bg-virens-green/15 text-virens-green border-virens-green/25' : ''}`}
        >
          #{tag}
        </button>
      ))}
    </div>
  )
}
