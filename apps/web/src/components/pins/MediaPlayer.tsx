import { useState, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import type { MediaType } from '@/types'

interface MediaPlayerProps {
  url: string
  thumbnailUrl: string
  type: MediaType
  alt: string
  isProtected?: boolean
  autoPlay?: boolean
  controls?: boolean
}

export default function MediaPlayer({
  url,
  thumbnailUrl,
  type,
  alt,
  isProtected = false,
  autoPlay = false,
  controls = false,
}: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(autoPlay)
  const [muted, setMuted] = useState(true)
  const [loaded, setLoaded] = useState(false)

  const preventInteraction = isProtected
    ? {
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
        onDragStart: (e: React.DragEvent) => e.preventDefault(),
        style: { userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties,
      }
    : {}

  const togglePlay = () => {
    if (!videoRef.current) return
    if (playing) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setPlaying(!playing)
  }

  if (type === 'image') {
    return (
      <img
        src={url}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`
          w-full h-full object-cover transition-opacity duration-300
          ${loaded ? 'opacity-100' : 'opacity-0'}
          ${isProtected ? 'pointer-events-none select-none' : ''}
        `}
        {...preventInteraction}
        draggable={!isProtected}
      />
    )
  }

  if (type === 'gif') {
    return (
      <img
        src={url}
        alt={alt}
        loading="lazy"
        className={`
          w-full h-full object-cover
          ${isProtected ? 'pointer-events-none select-none' : ''}
        `}
        {...preventInteraction}
        draggable={!isProtected}
      />
    )
  }

  // Video
  return (
    <div className="relative w-full h-full group/video">
      <video
        ref={videoRef}
        src={url}
        poster={thumbnailUrl}
        muted={muted}
        loop
        playsInline
        autoPlay={autoPlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className={`w-full h-full object-cover ${isProtected ? 'pointer-events-none' : ''}`}
        {...preventInteraction}
      />

      {/* Video controls overlay */}
      <div className="absolute inset-0 flex items-end justify-between p-3 opacity-0 group-hover/video:opacity-100 transition-opacity pointer-events-none">
        <button
          onClick={togglePlay}
          className="pointer-events-auto w-8 h-8 rounded-full glass flex items-center justify-center"
        >
          {playing
            ? <Pause size={14} className="text-white" />
            : <Play size={14} className="text-white ml-0.5" />
          }
        </button>

        <div className="flex items-center gap-1">
          <span className="text-[10px] text-white/70 bg-black/40 px-1.5 py-0.5 rounded">
            {type.toUpperCase()}
          </span>
          <button
            onClick={() => setMuted(!muted)}
            className="pointer-events-auto w-7 h-7 rounded-full glass flex items-center justify-center"
          >
            {muted
              ? <VolumeX size={12} className="text-white" />
              : <Volume2 size={12} className="text-white" />
            }
          </button>
        </div>
      </div>
    </div>
  )
}
