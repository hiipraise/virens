import type { MediaType } from '@/types'

interface PinnedMediaProps {
  url: string
  type: MediaType
}

export default function PinnedMedia({ url, type }: PinnedMediaProps) {
  if (type === 'video') {
    return (
      <video
        src={url}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      />
    )
  }
  return (
    <img
      src={url}
      alt="Profile cover"
      className="w-full h-full object-cover"
    />
  )
}
