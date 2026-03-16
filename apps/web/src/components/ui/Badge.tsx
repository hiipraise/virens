import { clsx } from 'clsx'

type BadgeVariant = 'green' | 'gray' | 'info' | 'warning' | 'error' | 'ai' | 'verified'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  green: 'bg-virens-green/15 text-virens-green border-virens-green/20',
  gray: 'bg-white/6 text-virens-white-muted border-white/8',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/15 text-red-400 border-red-500/20',
  ai: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  verified: 'bg-virens-green/15 text-virens-green border-virens-green/20',
}

export function Badge({ variant = 'gray', children, className, icon }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}
