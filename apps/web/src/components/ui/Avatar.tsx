import { clsx } from 'clsx'

interface AvatarProps {
  src?: string | null
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isVerified?: boolean
  className?: string
}

const sizes = {
  xs: 'w-5 h-5 text-[8px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-2xl',
}

const badgeSizes = {
  xs: 'w-2 h-2',
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
  xl: 'w-6 h-6',
}

export function Avatar({ src, alt, size = 'md', isVerified, className }: AvatarProps) {
  const initials = alt
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className={clsx('relative flex-shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={clsx(
            sizes[size],
            'rounded-full object-cover border border-white/8 bg-virens-gray'
          )}
          loading="lazy"
        />
      ) : (
        <div
          className={clsx(
            sizes[size],
            'rounded-full bg-virens-green/20 border border-virens-green/15 flex items-center justify-center font-display font-bold text-virens-green'
          )}
        >
          {initials}
        </div>
      )}
      {isVerified && (
        <span
          className={clsx(
            badgeSizes[size],
            'absolute -bottom-0.5 -right-0.5 rounded-full bg-virens-green border-2 border-virens-black flex items-center justify-center'
          )}
        >
          <svg viewBox="0 0 8 8" fill="none" className="w-full h-full p-[1px]">
            <path d="M1.5 4l1.8 1.8L6.5 2.5" stroke="#191414" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </div>
  )
}
