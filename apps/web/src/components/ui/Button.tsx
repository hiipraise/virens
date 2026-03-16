import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-virens-green text-virens-black font-semibold hover:bg-[#22d962] hover:shadow-[0_0_20px_rgba(29,185,84,0.35)] active:scale-95',
  secondary:
    'glass text-virens-white font-semibold border border-white/10 hover:border-virens-green/30 hover:text-virens-green active:scale-95',
  ghost:
    'text-virens-white-muted hover:text-virens-white hover:bg-white/5 active:scale-95',
  danger:
    'bg-virens-error/15 text-virens-error border border-virens-error/25 hover:bg-virens-error/25 active:scale-95',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-full gap-2',
  lg: 'px-7 py-3.5 text-base rounded-full gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.95 }}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center font-display transition-all duration-200',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...(props as React.ComponentPropsWithRef<typeof motion.button>)}
      >
        {loading ? (
          <Loader2 size={size === 'sm' ? 12 : size === 'lg' ? 18 : 15} className="animate-spin flex-shrink-0" />
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children}
        {iconRight && !loading && (
          <span className="flex-shrink-0">{iconRight}</span>
        )}
      </motion.button>
    )
  }
)
Button.displayName = 'Button'
